/**
 * Firestore Seed Script
 *
 * Populates initial data for the Book Club app.
 *
 * Prerequisites:
 *   1. Download a Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save it as `service-account.json` in the project root (it is git-ignored).
 *
 * Usage:
 *   npm install firebase-admin   (if not already installed)
 *   node scripts/seed.js
 */

const admin = require('firebase-admin')
// Users must set GOOGLE_APPLICATION_CREDENTIALS env var or pass serviceAccount directly
// For simplicity: read from a local service-account.json file if it exists
const serviceAccount = require('../service-account.json') // excluded from git

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function seed () {
  console.log('Seeding Firestore...')

  // ── config/main ────────────────────────────────────────────────────────────
  await db.collection('config').doc('main').set({
    currentBook: {
      title: 'The Name of the Wind',
      author: 'Patrick Rothfuss',
      genres: ['Epic Fantasy', 'Series'],
      synopsis: 'A young man grows to be the most notorious wizard his world has ever seen.',
      fullDescription: 'The riveting first-hand account of his life, told by Kvothe himself—now an innkeeper.',
      coverUrl: null,
      goodreadsUrl: 'https://www.goodreads.com/book/show/186074.The_Name_of_the_Wind',
      meeting: {
        date: '2026-06-15',
        time: '19:00',
        location: 'Grandma\'s house',
        discordVoiceUrl: null
      },
      discordThreads: [
        { title: 'General Discussion', url: 'https://discord.com/channels/placeholder/1' }
      ],
      supplementalMaterials: [],
      characters: [
        { name: 'Kvothe', description: 'The protagonist, a legendary wizard and musician.', firstAppearanceChapter: 1, isMajor: true },
        { name: 'Denna', description: 'A mysterious woman Kvothe is infatuated with.', firstAppearanceChapter: 3, isMajor: true }
      ],
      timeline: [
        { chapter: 1, label: 'Kvothe begins his story', note: 'The frame narrative starts.' },
        { chapter: 5, label: 'Kvothe arrives at the university', note: null }
      ]
    },
    audiobookServer: {
      description: 'Access our family Audiobookshelf server to listen along.',
      url: 'https://audiobooks.example.com'
    },
    familyMembers: ['Alice', 'Bob', 'Carol', 'Dave'],
    discordGuildId: 'YOUR_GUILD_ID_HERE',
    discordGuildUrl: 'https://discord.gg/your-invite',
    goodreadsGroupUrl: 'https://www.goodreads.com/group/show/your-group',
    audiobookServerUrl: 'https://audiobooks.example.com',
    discordWebhookUrl: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL'
  })
  console.log('  ✓ config/main written')

  // ── suggestions ────────────────────────────────────────────────────────────
  const suggestions = [
    {
      title: 'The Way of Kings',
      author: 'Brandon Sanderson',
      genres: ['Epic Fantasy', 'Series'],
      description: 'Roshar is a world of stone and storms.',
      coverUrl: null,
      alreadyRead: ['Alice'],
      suggestedBy: 'Bob',
      votes: 5,
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      title: 'Piranesi',
      author: 'Susanna Clarke',
      genres: ['Mystery', 'Magic'],
      description: 'A man lives in a labyrinthine House whose halls contain statues and tides.',
      coverUrl: null,
      alreadyRead: [],
      suggestedBy: 'Carol',
      votes: 3,
      createdAt: admin.firestore.Timestamp.now()
    },
    {
      title: 'A Deadly Education',
      author: 'Naomi Novik',
      genres: ['YA', 'Magic'],
      description: 'A girl at a school for magical students that wants to kill them.',
      coverUrl: null,
      alreadyRead: [],
      suggestedBy: 'Dave',
      votes: 1,
      createdAt: admin.firestore.Timestamp.now()
    }
  ]

  for (const suggestion of suggestions) {
    await db.collection('suggestions').add(suggestion)
  }
  console.log(`  ✓ ${suggestions.length} suggestions added`)

  // ── pastBooks ──────────────────────────────────────────────────────────────
  const pastBooks = [
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      genres: ['High Fantasy', 'Series'],
      synopsis: 'A hobbit goes on an unexpected journey.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2026-01-15')),
      discordThreadUrl: 'https://discord.com/channels/placeholder/past1'
    },
    {
      title: 'Circe',
      author: 'Madeline Miller',
      genres: ['Mythology', 'Literary Fiction'],
      synopsis: 'The story of Circe, daughter of the sun god Helios.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2025-10-20')),
      discordThreadUrl: 'https://discord.com/channels/placeholder/past2'
    }
  ]

  for (const book of pastBooks) {
    await db.collection('pastBooks').add(book)
  }
  console.log(`  ✓ ${pastBooks.length} pastBooks added`)

  console.log('Seeding complete.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
