/**
 * Seeds all book suggestions from Melissa Gibson's Goodreads to-read shelf.
 * Run ONCE — does not check for duplicates.
 *
 * Usage:
 *   node scripts/seed-suggestions.cjs
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const suggestions = [
  {
    title: 'Taipei Story',
    author: 'R.F. Kuang',
    genres: ['Fantasy', 'Romance'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-03-21')),
  },
  {
    title: 'Blood Over Bright Haven',
    author: 'M.L. Wang',
    genres: ['Dark Academia', 'Fantasy', 'Magic', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-03-21')),
  },
  {
    title: 'Mexican Gothic',
    author: 'Silvia Moreno-Garcia',
    genres: ['Horror', 'Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-03-21')),
  },
  {
    title: 'What Moves the Dead',
    author: 'T. Kingfisher',
    genres: ['Fantasy', 'Horror'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-03-07')),
  },
  {
    title: 'Nine Goblins',
    author: 'T. Kingfisher',
    genres: ['Fantasy', 'Humor', 'Magic'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-24')),
  },
  {
    title: 'The Magician of Tiger Castle',
    author: 'Louis Sachar',
    genres: ['Cozy', 'Fantasy', 'Romance'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-08-24')),
  },
  {
    title: 'The Art Spy',
    author: 'Michelle Young',
    genres: ['Biography', 'Non Fiction'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Blueprint for Revolution',
    author: 'Srdja Popovic',
    genres: ['Activism', 'Non Fiction'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: '1984',
    author: 'George Orwell',
    genres: ['Classic', 'Dystopian', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Animal Farm',
    author: 'George Orwell',
    genres: ['Classic', 'Dystopian', 'Fantasy'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Giver',
    author: 'Lois Lowry',
    genres: ['Classic', 'Dystopian', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Holes',
    author: 'Louis Sachar',
    genres: ['Classic', 'Mystery'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Worlds of Exile and Illusion',
    author: 'Ursula K. Le Guin',
    genres: ['Classic', 'Fantasy', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Devil in the White City',
    author: 'Erik Larson',
    genres: ['Mystery', 'Non Fiction'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genres: ['Fantasy', 'Magic', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Water Moon',
    author: 'Samantha Sotto Yambao',
    genres: ['Cozy', 'Fantasy', 'Magic', 'Mystery', 'Romance'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Serial Killer Support Group',
    author: 'Saratoga Schaefer',
    genres: ['Horror', 'LGBT+', 'Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Murder Your Employer',
    author: 'Rupert Holmes',
    genres: ['Humor', 'Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'If We Were Villains',
    author: 'M.L. Rio',
    genres: ['Dark Academia', 'LGBT+', 'Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'I Killed Zoe Spanos',
    author: 'Kit Frick',
    genres: ['Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Glass Hotel',
    author: 'Emily St. John Mandel',
    genres: ['Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Nine',
    author: 'Kes Trester',
    genres: ['Fantasy', 'Romance'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'A Wizard of Earthsea',
    author: 'Ursula K. Le Guin',
    genres: ['Fantasy', 'Horror', 'Magic'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Hundred Thousand Kingdoms',
    author: 'N.K. Jemisin',
    genres: ['Fantasy', 'Horror', 'Magic', 'Romance'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Malice',
    author: 'John Gwynne',
    genres: ['Fantasy', 'Magic'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Billy Summers',
    author: 'Stephen King',
    genres: ['Horror', 'Mystery', 'Thriller'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Cinder',
    author: 'Marissa Meyer',
    genres: ['Dystopian', 'Fantasy', 'Romance', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Thornhedge',
    author: 'T. Kingfisher',
    genres: ['Fantasy', 'Horror'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Nettle & Bone',
    author: 'T. Kingfisher',
    genres: ['Fantasy', 'Horror', 'Magic'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'The Will of the Many',
    author: 'James Islington',
    genres: ['Dark Academia', 'Fantasy', 'Mystery', 'SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Sabriel',
    author: 'Garth Nix',
    genres: ['Fantasy', 'Magic'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
  {
    title: 'Snow Crash',
    author: 'Neal Stephenson',
    genres: ['SciFi'],
    description: '',
    coverUrl: null,
    alreadyRead: [],
    suggestedBy: 'Melissa Gibson',
    votes: 0,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-06-28')),
  },
]

async function run() {
  console.log(`Seeding ${suggestions.length} suggestions…`)
  const col = db.collection('suggestions')
  for (const s of suggestions) {
    await col.add(s)
    console.log(`  + ${s.title}`)
  }
  console.log(`\nDone — ${suggestions.length} suggestions added.`)

  // Fetch and backfill descriptions + covers from Google Books
  console.log('\nFetching metadata from Google Books…')
  const snap = await col.orderBy('createdAt', 'desc').get()
  let updated = 0
  for (const docSnap of snap.docs) {
    const d = docSnap.data()
    if (d.description || d.coverUrl) continue // already has data
    const q = encodeURIComponent(`intitle:${d.title} inauthor:${d.author}`)
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
      if (!res.ok) continue
      const data = await res.json()
      const info = data.items?.[0]?.volumeInfo
      if (!info) continue
      const updates = {}
      if (info.description) updates.description = info.description.slice(0, 500)
      const thumb = info.imageLinks?.thumbnail
      if (thumb) updates.coverUrl = thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2')
      if (Object.keys(updates).length) {
        await docSnap.ref.update(updates)
        console.log(`  ✓ ${d.title}`)
        updated++
      }
    } catch { /* skip on error */ }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200))
  }
  console.log(`\n✓ Metadata updated for ${updated} suggestions.`)
  process.exit(0)
}

run().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
