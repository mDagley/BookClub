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
const serviceAccount = require('../service-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function seed () {
  console.log('Seeding Firestore...')

  // ── config/main ────────────────────────────────────────────────────────────
  await db.collection('config').doc('main').set({
    currentBook: {
      title: 'Gideon the Ninth',
      author: 'Tamsyn Muir',
      genres: ['SciFi', 'Horror'],
      synopsis: 'The Emperor needs necromancers. The Ninth Necromancer needs a swordswoman. Gideon has a sword, some dirty magazines, and no more time for undead bullshit.',
      fullDescription: 'Tamsyn Muir\'s Gideon the Ninth unveils a universe of swords, necromancy, and science. The Emperor needs necromancers. The Ninth Necromancer needs a swordswoman. Gideon has a sword, some dirty magazines, and no more time for undead bullshit.',
      coverUrl: null,
      goodreadsUrl: 'https://www.goodreads.com/book/show/42036538-gideon-the-ninth',
      meeting: {
        date: null,
        time: null,
        location: 'TBD',
        discordVoiceUrl: null
      },
      discordThreads: [],
      supplementalMaterials: [],
      characters: [],
      timeline: []
    },
    audiobookServer: {
      description: 'Access our family Audiobookshelf server to listen along.',
      url: null
    },
    familyMembers: ['Jonathan Gibson', 'Melissa Gibson', 'Michael Gibson', 'Beth Gibson'],
    discordGuildId: '1355392166553325598',
    discordGuildUrl: 'https://discord.gg/FzTvG5fpb',
    goodreadsGroupUrl: '',
    audiobookServerUrl: null,
    discordWebhookUrl: null
  })
  console.log('  ✓ config/main written')

  // ── pastBooks ──────────────────────────────────────────────────────────────
  const pastBooks = [
    {
      title: 'Dawn',
      author: 'Octavia E. Butler',
      genres: ['SciFi', 'Horror'],
      synopsis: 'Lilith Iyapo wakes after nuclear war to find herself aboard an alien ship — and humanity\'s survival depends on a deal she never agreed to.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2026-05-17')),
      discordThreadUrl: null
    },
    {
      title: 'The Tainted Cup',
      author: 'Robert Jackson Bennett',
      genres: ['Mystery'],
      synopsis: 'In a world where human augmentation is common, an investigator and his uniquely gifted assistant must solve an impossible murder.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2026-03-06')),
      discordThreadUrl: null
    },
    {
      title: 'Juniper & Thorn',
      author: 'Ava Reid',
      genres: ['Horror', 'Historical Fiction', 'Romance'],
      synopsis: 'A monster\'s daughter discovers love and dark magic in a crumbling city where something is killing the men one by one.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2025-10-01')),
      discordThreadUrl: null
    },
    {
      title: 'Butter',
      author: 'Asako Yuzuki',
      genres: ['Mystery'],
      synopsis: 'A journalist investigates a woman on death row for poisoning her lovers — and finds herself dangerously drawn into her world of food and obsession.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2025-07-26')),
      discordThreadUrl: null
    },
    {
      title: 'The Long Way to a Small, Angry Planet',
      author: 'Becky Chambers',
      genres: ['SciFi'],
      synopsis: 'A found family of misfits crew a tunnelling ship through the galaxy, building a wormhole to the most dangerous place in the universe.',
      coverUrl: null,
      dateRead: admin.firestore.Timestamp.fromDate(new Date('2025-06-14')),
      discordThreadUrl: null
    }
  ]

  for (const book of pastBooks) {
    await db.collection('pastBooks').add(book)
  }
  console.log(`  ✓ ${pastBooks.length} past books added`)

  console.log('Seeding complete.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
