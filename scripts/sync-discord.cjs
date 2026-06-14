#!/usr/bin/env node
// Syncs data from Discord book channels to Firestore past books.
// Pulls: quotes from "Quotes" threads, supplemental materials from
// "Supplemental Materials" / "Additional Resources" / "Resources" threads.
// Deduplicates against existing Firestore data before writing.
// Run manually: node scripts/sync-discord.js
// Run in CI: triggered by GitHub Actions (see .github/workflows/discord-sync.yml)

const fs = require('fs')
const path = require('path')

// Load .env in local dev; in CI credentials come from environment
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.claude', 'worktrees', 'implement', '.env'),
  ]
  const envPath = candidates.find(p => fs.existsSync(p))
  if (envPath) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^(FIREBASE_SERVICE_ACCOUNT|DISCORD_BOT_TOKEN|DISCORD_GUILD_ID)\s*=\s*(.+)$/)
      if (m) process.env[m[1]] = m[2].trim()
    }
  }
}

const { FIREBASE_SERVICE_ACCOUNT, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env
if (!FIREBASE_SERVICE_ACCOUNT || !DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const admin = require(path.join(__dirname, '..', 'server', 'node_modules', 'firebase-admin'))
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(FIREBASE_SERVICE_ACCOUNT, 'base64').toString())
    ),
  })
}
const db = admin.firestore()

// ── Discord helpers ───────────────────────────────────────────────────────────

async function discord(endpoint) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Discord ${endpoint} → ${res.status}`)
  return res.json()
}

async function getMessages(channelId, limit = 100) {
  const msgs = await discord(`/channels/${channelId}/messages?limit=${limit}`)
  return Array.isArray(msgs) ? msgs.reverse() : []
}

// Find a thread by name in archived public threads for a forum channel
async function findThread(forumId, name) {
  const archived = await discord(`/channels/${forumId}/threads/archived/public?limit=50`)
  const lname = name.toLowerCase()
  return archived.threads?.find(t => t.name.toLowerCase().includes(lname))?.id ?? null
}

// ── Quotes extraction ─────────────────────────────────────────────────────────

function cleanQuote(raw) {
  return raw
    .split('\n')
    .map(l => l.replace(/^>\s?/, '').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function extractQuotesFromMessages(messages) {
  const quotes = []
  for (const msg of messages) {
    const content = msg.content?.trim()
    if (!content || !content.includes('>')) continue
    if (!content.includes('>') && content.split(/\s+/).length < 4) continue
    const blocks = content.split(/\n\n+/)
    for (const block of blocks) {
      if (!block.includes('>')) continue
      const text = cleanQuote(block)
      if (text.length > 10) quotes.push({ text, attribution: '' })
    }
  }
  return quotes
}

// ── Supplemental materials extraction ────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s\)\]>]+/g

function typeFromUrl(url) {
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return 'video'
  if (/spotify\.com|soundcloud\.com|podcasts\./i.test(url)) return 'podcast'
  return 'article'
}

function titleFromContext(message, url) {
  const text = message.replace(url, '').trim()
  // Take the last non-empty line before the URL as the title
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.length > 4 && !line.startsWith('http') && !line.startsWith('-')) {
      // Strip list markers and trailing punctuation
      return line.replace(/^[-*•]\s*/, '').replace(/[.:,]$/, '').trim()
    }
  }
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch { return url }
}

function extractMaterialsFromMessages(messages) {
  const materials = []
  const seen = new Set()
  for (const msg of messages) {
    const content = msg.content?.trim()
    if (!content) continue
    const urls = content.match(URL_REGEX) || []
    for (const url of urls) {
      if (seen.has(url)) continue
      seen.add(url)
      // Skip Discord invite / hulu / subscription-only links
      if (/discord\.gg|discord\.com\/api/i.test(url)) continue
      const title = titleFromContext(content, url)
      const type = typeFromUrl(url)
      materials.push({ type, title, url })
    }
  }
  return materials
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

function mergeQuotes(existing, incoming) {
  const seen = new Set(existing.map(q => q.text.slice(0, 60)))
  const added = []
  for (const q of incoming) {
    if (!seen.has(q.text.slice(0, 60))) {
      seen.add(q.text.slice(0, 60))
      existing.push(q)
      added.push(q)
    }
  }
  return added
}

function mergeMaterials(existing, incoming) {
  const seenUrls = new Set(existing.map(m => m.url).filter(Boolean))
  const added = []
  for (const m of incoming) {
    if (m.url && !seenUrls.has(m.url)) {
      seenUrls.add(m.url)
      existing.push(m)
      added.push(m)
    }
  }
  return added
}

// ── Channel map ───────────────────────────────────────────────────────────────
// Maps Firestore pastBook title → Discord channel info
// type 0 = text channel, type 15 = forum channel

const CHANNEL_MAP = {
  'Butter': { id: '1388506469275795538', type: 0 },
  'The Long Way to a Small, Angry Planet': { id: '1360980434309087262', type: 0 },
  'Juniper & Thorn': { id: '1418927009555546192', type: 15 },
  'The Tainted Cup': { id: '1439335057042051123', type: 0 },
  'Dawn': { id: '1479843880814907442', type: 15 },
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function syncBook(book, channel) {
  let newQuotes = 0
  let newMaterials = 0

  const quotes = book.quotes ? [...book.quotes] : []
  const materials = book.supplementalMaterials ? [...book.supplementalMaterials] : []

  if (channel.type === 15) {
    // Forum channel — look for named threads
    const quotesThreadId = await findThread(channel.id, 'quotes')
    if (quotesThreadId) {
      const msgs = await getMessages(quotesThreadId)
      const extracted = extractQuotesFromMessages(msgs)
      newQuotes = mergeQuotes(quotes, extracted).length
    }

    for (const threadName of ['supplemental material', 'additional resource', 'resource', 'material']) {
      const threadId = await findThread(channel.id, threadName)
      if (threadId) {
        const msgs = await getMessages(threadId)
        const extracted = extractMaterialsFromMessages(msgs)
        newMaterials += mergeMaterials(materials, extracted).length
        break
      }
    }
  } else {
    // Text channel — scan all messages for quotes and URLs
    const msgs = await getMessages(channel.id)
    const extractedQ = extractQuotesFromMessages(msgs)
    newQuotes = mergeQuotes(quotes, extractedQ).length
    const extractedM = extractMaterialsFromMessages(msgs)
    newMaterials = mergeMaterials(materials, extractedM).length
  }

  if (newQuotes > 0 || newMaterials > 0) {
    const update = {}
    if (newQuotes > 0) update.quotes = quotes
    if (newMaterials > 0) update.supplementalMaterials = materials
    await db.collection('pastBooks').doc(book.id).update(update)
  }

  return { newQuotes, newMaterials }
}

async function main() {
  const snap = await db.collection('pastBooks').get()
  const books = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  let totalQuotes = 0
  let totalMaterials = 0

  for (const book of books) {
    const channel = CHANNEL_MAP[book.title]
    if (!channel) {
      console.log(`"${book.title}": no Discord channel mapped — skipping`)
      continue
    }
    process.stdout.write(`"${book.title}"… `)
    try {
      const { newQuotes, newMaterials } = await syncBook(book, channel)
      totalQuotes += newQuotes
      totalMaterials += newMaterials
      console.log(
        newQuotes || newMaterials
          ? `+${newQuotes} quotes, +${newMaterials} materials`
          : 'nothing new'
      )
    } catch (err) {
      console.log(`error: ${err.message}`)
    }
  }

  console.log(`\nDone. Total new: ${totalQuotes} quotes, ${totalMaterials} materials.`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
