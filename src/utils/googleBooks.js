const GENRE_KEYWORD_MAP = [
  { keywords: ['dystopia', 'dystopian', 'post-apocalyptic', 'post apocalyptic'], genre: 'Dystopian' },
  { keywords: ['science fiction', 'sci-fi', 'space opera', 'cyberpunk'], genre: 'SciFi' },
  { keywords: ['mystery', 'detective', 'crime', 'noir', 'whodunit', 'true crime'], genre: 'Mystery' },
  { keywords: ['thriller', 'suspense'], genre: 'Thriller' },
  { keywords: ['horror', 'gothic'], genre: 'Horror' },
  { keywords: ['romance', 'romantic'], genre: 'Romance' },
  { keywords: ['cozy'], genre: 'Cozy' },
  { keywords: ['dark academia'], genre: 'Dark Academia' },
  { keywords: ['magic', 'magical realism', 'witch', 'wizard', 'necromancer', 'sorcery'], genre: 'Magic' },
  { keywords: ['humor', 'comedy', 'humorous', 'satire', 'wit'], genre: 'Humor' },
  { keywords: ['biography', 'autobiography', 'memoir'], genre: 'Biography' },
  { keywords: ['nonfiction', 'non-fiction', 'non fiction', 'history', 'self-help', 'true story'], genre: 'Non Fiction' },
  { keywords: ['classic', 'classics', 'literary classic'], genre: 'Classic' },
  { keywords: ['lgbtq', 'lgbt', 'queer'], genre: 'LGBT+' },
  { keywords: ['activism', 'social justice', 'political'], genre: 'Activism' },
  { keywords: ['fantasy'], genre: 'Fantasy' },
]

// Scan categories AND description text — API categories are often too sparse
function mapCategoriesToGenres(categories = [], description = '') {
  const seen = new Set()
  const genres = []
  const haystack = (categories.map(c => c.toLowerCase()).join(' ') + ' ' + description.toLowerCase()).trim()
  for (const { keywords, genre } of GENRE_KEYWORD_MAP) {
    if (seen.has(genre)) continue
    if (keywords.some(k => haystack.includes(k))) {
      seen.add(genre)
      genres.push(genre)
    }
  }
  return genres
}

// Returns true if the URL resolves to Google's generic "no cover" placeholder.
// Google's placeholder is ≤128px wide regardless of the zoom level requested;
// real covers at zoom=2 are typically 200px+ wide.
function isGenericCover(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth <= 128 && img.naturalHeight <= 200)
    img.onerror = () => resolve(true)
    img.src = url
  })
}

// ── Google Books ──────────────────────────────────────────────────────────────

async function fetchFromGoogleBooks(title, author) {
  try {
    const q = encodeURIComponent(`intitle:${title}${author ? ` inauthor:${author}` : ''}`)
    const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
    const keyParam = key ? `&key=${key}` : ''
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${keyParam}`)
    if (!res.ok) return null
    const data = await res.json()
    const info = data.items?.[0]?.volumeInfo
    if (!info) return null

    const rawDesc = info.description || ''
    const firstPara = rawDesc.split(/\n\n|\r\n\r\n/)[0].trim()
    const synopsis = firstPara.length > 220 ? firstPara.slice(0, 217) + '…' : firstPara || null
    const thumbnail = info.imageLinks?.thumbnail
    let coverUrl = thumbnail
      ? thumbnail.replace('http://', 'https://').replace(/zoom=\d+/, 'zoom=3')
      : null

    if (coverUrl && await isGenericCover(coverUrl)) coverUrl = null

    return {
      coverUrl,
      synopsis,
      fullDescription: rawDesc || null,
      genres: mapCategoriesToGenres(info.categories, rawDesc),
      publishedDate: info.publishedDate || null,
    }
  } catch {
    return null
  }
}

// ── Open Library ──────────────────────────────────────────────────────────────

async function fetchFromOpenLibrary(title, author) {
  try {
    const params = new URLSearchParams({
      title,
      ...(author ? { author } : {}),
      limit: '1',
      fields: 'key,cover_i,subject,first_sentence',
    })
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) return null

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null

    // Fetch full description from the work record
    let fullDescription = null
    let synopsis = null
    if (doc.key) {
      try {
        const workRes = await fetch(`https://openlibrary.org${doc.key}.json`)
        if (workRes.ok) {
          const work = await workRes.json()
          const raw = work.description
          if (raw) {
            fullDescription = typeof raw === 'string' ? raw : raw.value
            const firstPara = fullDescription.split(/\n\n|\r\n\r\n/)[0].trim()
            synopsis = firstPara.length > 220 ? firstPara.slice(0, 217) + '…' : firstPara || null
          }
        }
      } catch { /* description is optional */ }
    }

    // Fall back to first_sentence as synopsis if no description found
    if (!synopsis && doc.first_sentence) {
      const fs = doc.first_sentence
      synopsis = (typeof fs === 'string' ? fs : fs.value) || null
    }

    return {
      coverUrl,
      synopsis,
      fullDescription,
      genres: mapCategoriesToGenres(doc.subject || [], fullDescription || ''),
    }
  } catch {
    return null
  }
}

// ── Search (for autocomplete) ─────────────────────────────────────────────────

export async function searchBooks(query) {
  if (!query || query.length < 2) return []
  try {
    const q = encodeURIComponent(query)
    const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
    const keyParam = key ? `&key=${key}` : ''
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6${keyParam}`
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!data.items?.length) return []
    return data.items
      .map(item => {
        const info = item.volumeInfo || {}
        const rawDesc = info.description || ''
        const firstPara = rawDesc.split(/\n\n|\r\n\r\n/)[0].trim()
        const synopsis = firstPara.length > 220 ? firstPara.slice(0, 217) + '…' : firstPara || null
        const thumbnail = info.imageLinks?.thumbnail
        const coverUrl = thumbnail
          ? thumbnail.replace('http://', 'https://').replace(/zoom=\d+/, 'zoom=3')
          : null
        return {
          title: info.title || '',
          author: (info.authors || []).join(', '),
          coverUrl,
          synopsis,
          fullDescription: rawDesc || null,
          genres: mapCategoriesToGenres(info.categories, rawDesc),
          publishedDate: info.publishedDate || null,
        }
      })
      .filter(r => r.title)
  } catch {
    return []
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

// Tries Google Books first, then Open Library as fallback.
// Merges the best available data from both sources.
export async function fetchBookMetadata(title, author) {
  if (!title) return null

  const [gbResult, olResult] = await Promise.allSettled([
    fetchFromGoogleBooks(title, author),
    fetchFromOpenLibrary(title, author),
  ])

  const gb = gbResult.status === 'fulfilled' ? gbResult.value : null
  const ol = olResult.status === 'fulfilled' ? olResult.value : null

  if (!gb && !ol) return null

  return {
    coverUrl:        gb?.coverUrl        ?? ol?.coverUrl        ?? null,
    synopsis:        gb?.synopsis        ?? ol?.synopsis        ?? null,
    fullDescription: gb?.fullDescription ?? ol?.fullDescription ?? null,
    genres:          (gb?.genres?.length ? gb.genres : ol?.genres) ?? [],
    publishedDate:   gb?.publishedDate   ?? null,
  }
}

// Kept for backward-compat (used by SuggestModal background cover update).
export async function fetchCoverUrl(title, author) {
  const meta = await fetchBookMetadata(title, author)
  return meta?.coverUrl ?? null
}
