/**
 * Migration script — run once after updating the genre list.
 *
 * Does two things:
 *   1. Migrates old genre names to new ones across all Firestore collections
 *   2. Refreshes the current book's cover, synopsis, and description from Google Books
 *
 * Usage:
 *   node scripts/migrate.cjs
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

// ── Genre name mapping ────────────────────────────────────────────────────────
// null = remove the genre entirely (no equivalent in new list)
const GENRE_MAP = {
  'Sci-Fi':            'SciFi',
  'Epic Fantasy':      'Fantasy',
  'High Fantasy':      'Fantasy',
  'Cozy Fantasy':      'Cozy',
  'Dark Fantasy':      'Fantasy',
  'Literary Fantasy':  'Fantasy',
  'Historical Fiction':'Classic',
  'Literary Fiction':  'Classic',
  'Magic Realism':     'Magic',
  'Mythology':         null,
  'YA':                null,
  'Series':            null,
  'Standalone':        null,
  // Already-correct names (identity map so unknown genres are caught below)
  'Horror':            'Horror',
  'Mystery':           'Mystery',
  'Romance':           'Romance',
  'Humor':             'Humor',
  'Magic':             'Magic',
  'Thriller':          'Thriller',
  'Dark Academia':     'Dark Academia',
  'Dystopian':         'Dystopian',
  'LGBT+':             'LGBT+',
  'Non Fiction':       'Non Fiction',
  'Biography':         'Biography',
  'Classic':           'Classic',
  'Activism':          'Activism',
  'SciFi':             'SciFi',
}

function migrateGenres(genres) {
  if (!Array.isArray(genres)) return []
  const seen = new Set()
  for (const g of genres) {
    if (g in GENRE_MAP) {
      const mapped = GENRE_MAP[g]
      if (mapped) seen.add(mapped)
    } else {
      seen.add(g) // unknown genre — keep as-is
    }
  }
  return [...seen]
}

// ── Metadata fetch (Google Books → Open Library fallback) ─────────────────────
async function fetchFromGB(title, author) {
  try {
    const q = encodeURIComponent(`intitle:${title} inauthor:${author}`)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
    if (!res.ok) return null
    const data = await res.json()
    const info = data.items?.[0]?.volumeInfo
    if (!info) return null
    const thumb = info.imageLinks?.thumbnail
    const rawDesc = info.description || ''
    const firstPara = rawDesc.split(/\n\n|\r\n\r\n/)[0].trim()
    return {
      coverUrl: thumb ? thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2') : null,
      synopsis: firstPara.length > 220 ? firstPara.slice(0, 217) + '…' : firstPara || null,
      fullDescription: rawDesc || null,
    }
  } catch { return null }
}

async function fetchFromOL(title, author) {
  try {
    const params = new URLSearchParams({ title, author, limit: '1', fields: 'key,cover_i,first_sentence' })
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) return null
    const doc = (await res.json()).docs?.[0]
    if (!doc) return null
    const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null
    let fullDescription = null, synopsis = null
    if (doc.key) {
      try {
        const wr = await fetch(`https://openlibrary.org${doc.key}.json`)
        if (wr.ok) {
          const raw = (await wr.json()).description
          if (raw) {
            fullDescription = typeof raw === 'string' ? raw : raw.value
            const fp = fullDescription.split(/\n\n|\r\n\r\n/)[0].trim()
            synopsis = fp.length > 220 ? fp.slice(0, 217) + '…' : fp || null
          }
        }
      } catch {}
    }
    if (!synopsis && doc.first_sentence) {
      const fs = doc.first_sentence
      synopsis = (typeof fs === 'string' ? fs : fs.value) || null
    }
    return { coverUrl, synopsis, fullDescription }
  } catch { return null }
}

async function fetchMetadata(title, author) {
  const [gbr, olr] = await Promise.allSettled([fetchFromGB(title, author), fetchFromOL(title, author)])
  const gb = gbr.status === 'fulfilled' ? gbr.value : null
  const ol = olr.status === 'fulfilled' ? olr.value : null
  if (!gb && !ol) return null
  return {
    coverUrl:        gb?.coverUrl        ?? ol?.coverUrl        ?? null,
    synopsis:        gb?.synopsis        ?? ol?.synopsis        ?? null,
    fullDescription: gb?.fullDescription ?? ol?.fullDescription ?? null,
  }
}

// ── Migration ─────────────────────────────────────────────────────────────────
async function run() {
  console.log('Starting migration…\n')

  // 1. pastBooks
  const pastSnap = await db.collection('pastBooks').get()
  let pastUpdated = 0
  for (const docSnap of pastSnap.docs) {
    const data = docSnap.data()
    const newGenres = migrateGenres(data.genres)
    const changed = JSON.stringify(data.genres) !== JSON.stringify(newGenres)
    if (changed) {
      await docSnap.ref.update({ genres: newGenres })
      console.log(`  pastBooks/${docSnap.id}: ${(data.genres || []).join(', ')} → ${newGenres.join(', ')}`)
      pastUpdated++
    }
  }
  console.log(`✓ pastBooks: ${pastUpdated}/${pastSnap.size} updated\n`)

  // 2. suggestions
  const sugSnap = await db.collection('suggestions').get()
  let sugUpdated = 0
  for (const docSnap of sugSnap.docs) {
    const data = docSnap.data()
    const newGenres = migrateGenres(data.genres)
    const changed = JSON.stringify(data.genres) !== JSON.stringify(newGenres)
    if (changed) {
      await docSnap.ref.update({ genres: newGenres })
      console.log(`  suggestions/${docSnap.id} (${data.title}): ${(data.genres || []).join(', ')} → ${newGenres.join(', ')}`)
      sugUpdated++
    }
  }
  console.log(`✓ suggestions: ${sugUpdated}/${sugSnap.size} updated\n`)

  // 3. config/main currentBook genres
  const configSnap = await db.doc('config/main').get()
  const config = configSnap.data()
  const book = config?.currentBook
  if (book) {
    const updates = {}

    const newGenres = migrateGenres(book.genres)
    if (JSON.stringify(book.genres) !== JSON.stringify(newGenres)) {
      updates['currentBook.genres'] = newGenres
      console.log(`currentBook genres: ${(book.genres || []).join(', ')} → ${newGenres.join(', ')}`)
    }

    // Refresh metadata from Google Books
    console.log(`\nFetching metadata for "${book.title}" by ${book.author}…`)
    const meta = await fetchMetadata(book.title, book.author)
    if (meta) {
      if (meta.coverUrl && !book.coverUrl) {
        updates['currentBook.coverUrl'] = meta.coverUrl
        console.log(`  coverUrl: ${meta.coverUrl}`)
      }
      if (meta.synopsis && !book.synopsis) {
        updates['currentBook.synopsis'] = meta.synopsis
        console.log(`  synopsis: set (${meta.synopsis.length} chars)`)
      }
      if (meta.fullDescription && !book.fullDescription) {
        updates['currentBook.fullDescription'] = meta.fullDescription
        console.log(`  fullDescription: set (${meta.fullDescription.length} chars)`)
      }
    } else {
      console.log('  Google Books returned no results — skipping metadata update')
    }

    if (Object.keys(updates).length > 0) {
      await db.doc('config/main').update(updates)
      console.log(`\n✓ config/main updated`)
    } else {
      console.log('\n✓ config/main already up to date')
    }
  }

  console.log('\nMigration complete.')
  process.exit(0)
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
