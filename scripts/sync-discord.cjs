#!/usr/bin/env node
// Syncs data from Discord book channels to Firestore.
//
// Past books — for each book in the finished category (or CHANNEL_MAP):
//   - discordThreads: derived from channel (text channel → one entry; forum → all threads)
//   - quotes: extracted from Quotes threads
//   - supplementalMaterials: extracted from Resources threads
//
// Current book — finds the channel in the current category by title slug:
//   - discordThreads: all threads in the channel
//   - quotes: extracted from Quotes thread
//   - supplementalMaterials: extracted from Resources thread
//
// Run manually: node scripts/sync-discord.cjs
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
      const m = line.match(/^(FIREBASE_SERVICE_ACCOUNT|DISCORD_BOT_TOKEN|DISCORD_GUILD_ID|DISCORD_FINISHED_CATEGORY_ID|DISCORD_CURRENT_CATEGORY_ID)\s*=\s*(.+)$/)
      if (m) process.env[m[1]] = m[2].trim()
    }
  }
}

const {
  FIREBASE_SERVICE_ACCOUNT,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_FINISHED_CATEGORY_ID,
  DISCORD_CURRENT_CATEGORY_ID,
} = process.env

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

// Active-threads cache — fetched once per run, reused by findThread + getForumThreads
let _activeThreads = null
async function getActiveThreads() {
  if (_activeThreads) return _activeThreads
  try {
    const res = await discord(`/guilds/${DISCORD_GUILD_ID}/threads/active`)
    _activeThreads = res.threads || []
  } catch {
    _activeThreads = []
  }
  return _activeThreads
}

async function findThread(forumId, name) {
  const lname = name.toLowerCase()
  try {
    const archived = await discord(`/channels/${forumId}/threads/archived/public?limit=50`)
    const found = archived.threads?.find(t => t.name.toLowerCase().includes(lname))
    if (found) return found.id
  } catch {}
  const active = await getActiveThreads()
  return active.find(t => t.parent_id === forumId && t.name.toLowerCase().includes(lname))?.id ?? null
}

// ── Channel discovery ─────────────────────────────────────────────────────────

// Explicit channel overrides — used when the channel name doesn't match the title slug
// or to lock in a specific channel ID. Auto-discovery fills gaps for all other books.
const CHANNEL_MAP = {
  'Butter':                                      { id: '1388506469275795538', type: 0 },
  'The Long Way to a Small, Angry Planet':       { id: '1360980434309087262', type: 0 },
  'Juniper & Thorn':                             { id: '1418927009555546192', type: 15 },
  'The Tainted Cup':                             { id: '1439335057042051123', type: 0 },
  'Dawn':                                        { id: '1479843880814907442', type: 15 },
}

function titleToSlug(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveChannel(bookTitle, allChannels, categoryId) {
  // Explicit override takes priority
  const mapped = CHANNEL_MAP[bookTitle]
  if (mapped) {
    const full = allChannels.find(c => c.id === mapped.id)
    return full ?? { id: mapped.id, type: mapped.type, name: bookTitle }
  }
  // Auto-discover by slug match — restrict to text/forum channels only
  const slug = titleToSlug(bookTitle)
  const candidates = categoryId
    ? allChannels.filter(c => c.parent_id === categoryId)
    : allChannels // fallback: search all channels if category env var not set
  if (!categoryId) {
    console.warn(`  Warning: no category ID set for "${bookTitle}" — searching all channels`)
  }
  return candidates.find(c => {
    if (c.type !== 0 && c.type !== 15) return false
    const cSlug = titleToSlug(c.name)
    return cSlug === slug || cSlug.startsWith(slug) || slug.startsWith(cSlug)
  }) ?? null
}

// ── Thread enumeration ────────────────────────────────────────────────────────

async function getForumThreads(channelId) {
  const threads = []
  const seen = new Set()
  // Paginate through all archived threads
  let before = null
  while (true) {
    const qs = `limit=100${before ? `&before=${encodeURIComponent(before)}` : ''}`
    let page
    try { page = await discord(`/channels/${channelId}/threads/archived/public?${qs}`) } catch { break }
    for (const t of page.threads || []) {
      if (!seen.has(t.id)) { seen.add(t.id); threads.push(t) }
    }
    if (!page.has_more) break
    const last = page.threads?.[page.threads.length - 1]
    before = last?.thread_metadata?.archive_timestamp ?? null
    if (!before) break
  }
  // Active threads (uses cached response)
  const active = await getActiveThreads()
  for (const t of active) {
    if (t.parent_id === channelId && !seen.has(t.id)) { seen.add(t.id); threads.push(t) }
  }
  return threads
}

async function buildDiscordThreads(channel) {
  const base = `https://discord.com/channels/${DISCORD_GUILD_ID}`
  if (channel.type === 0) {
    const title = channel.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return [{ title, url: `${base}/${channel.id}` }]
  }
  if (channel.type === 15) {
    const threads = await getForumThreads(channel.id)
    if (!threads.length) return [{ title: 'Discussion', url: `${base}/${channel.id}` }]
    return threads.map(t => ({ title: t.name, url: `${base}/${t.id}` }))
  }
  return []
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
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.length > 4 && !line.startsWith('http') && !line.startsWith('-')) {
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
      if (/discord\.gg|discord\.com\/api/i.test(url)) continue
      const title = titleFromContext(content, url)
      const type = typeFromUrl(url)
      materials.push({ type, title, url })
    }
  }
  return materials
}

// ── Comparison helpers ────────────────────────────────────────────────────────

function threadsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  return a.every((t, i) => t.url === b[i].url && t.title === b[i].title)
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

// ── Sync a single channel's quotes + materials ────────────────────────────────

async function syncContentFromChannel(channel, existing) {
  const quotes = existing.quotes ? [...existing.quotes] : []
  const materials = existing.supplementalMaterials ? [...existing.supplementalMaterials] : []
  let newQuotes = 0
  let newMaterials = 0

  if (channel.type === 15) {
    const quotesThreadId = await findThread(channel.id, 'quotes')
    if (quotesThreadId) {
      const msgs = await getMessages(quotesThreadId)
      newQuotes = mergeQuotes(quotes, extractQuotesFromMessages(msgs)).length
    }
    for (const name of ['supplemental material', 'additional resource', 'resource', 'material']) {
      const threadId = await findThread(channel.id, name)
      if (threadId) {
        const msgs = await getMessages(threadId)
        newMaterials += mergeMaterials(materials, extractMaterialsFromMessages(msgs)).length
        break
      }
    }
  } else {
    const msgs = await getMessages(channel.id)
    newQuotes = mergeQuotes(quotes, extractQuotesFromMessages(msgs)).length
    newMaterials = mergeMaterials(materials, extractMaterialsFromMessages(msgs)).length
  }

  return { quotes, materials, newQuotes, newMaterials }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch all guild channels once — used for auto-discovery
  let allChannels = []
  try {
    allChannels = await discord(`/guilds/${DISCORD_GUILD_ID}/channels`)
  } catch (err) {
    console.warn('Could not fetch guild channels (auto-discovery disabled):', err.message)
  }

  // ── Past books ──────────────────────────────────────────────────────────────
  console.log('── Past books ──')
  const snap = await db.collection('pastBooks').get()
  const books = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  let totalQuotes = 0
  let totalMaterials = 0

  for (const book of books) {
    const channel = resolveChannel(book.title, allChannels, DISCORD_FINISHED_CATEGORY_ID)
    if (!channel) {
      console.log(`  "${book.title}": no Discord channel found — skipping`)
      continue
    }
    process.stdout.write(`  "${book.title}"… `)
    try {
      const threads = await buildDiscordThreads(channel)
      const { quotes, materials, newQuotes, newMaterials } = await syncContentFromChannel(channel, book)

      const update = {}
      if (!threadsEqual(threads, book.discordThreads)) update.discordThreads = threads
      if (newQuotes > 0) update.quotes = quotes
      if (newMaterials > 0) update.supplementalMaterials = materials
      if (Object.keys(update).length === 0) {
        console.log('no changes')
        continue
      }
      await db.collection('pastBooks').doc(book.id).update(update)

      totalQuotes += newQuotes
      totalMaterials += newMaterials
      const parts = []
      if (update.discordThreads) parts.push(`${threads.length} thread(s)`)
      if (newQuotes) parts.push(`+${newQuotes} quotes`)
      if (newMaterials) parts.push(`+${newMaterials} materials`)
      console.log(parts.join(', '))
    } catch (err) {
      console.log(`error: ${err.message}`)
    }
  }

  // ── Current book ────────────────────────────────────────────────────────────
  console.log('\n── Current book ──')
  try {
    const configDoc = await db.collection('config').doc('main').get()
    const currentBook = configDoc.data()?.currentBook
    if (!currentBook?.title) {
      console.log('  Not set — skipping')
    } else {
      const channel = resolveChannel(currentBook.title, allChannels, DISCORD_CURRENT_CATEGORY_ID)
      if (!channel) {
        console.log(`  "${currentBook.title}": no Discord channel found`)
      } else {
        process.stdout.write(`  "${currentBook.title}"… `)
        const threads = await buildDiscordThreads(channel)
        const { quotes, materials, newQuotes, newMaterials } = await syncContentFromChannel(channel, currentBook)

        const update = {}
        if (!threadsEqual(threads, currentBook.discordThreads)) update['currentBook.discordThreads'] = threads
        if (newQuotes > 0) update['currentBook.quotes'] = quotes
        if (newMaterials > 0) update['currentBook.supplementalMaterials'] = materials
        if (Object.keys(update).length === 0) {
          console.log('no changes')
        } else {
          await db.collection('config').doc('main').update(update)
          totalQuotes += newQuotes
          totalMaterials += newMaterials
          const parts = []
          if (update['currentBook.discordThreads']) parts.push(`${threads.length} thread(s)`)
          if (newQuotes) parts.push(`+${newQuotes} quotes`)
          if (newMaterials) parts.push(`+${newMaterials} materials`)
          console.log(parts.join(', '))
        }
      }
    }
  } catch (err) {
    console.log(`  error: ${err.message}`)
  }

  console.log(`\nDone. Total new: ${totalQuotes} quotes, ${totalMaterials} materials.`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
