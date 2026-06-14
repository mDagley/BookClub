const express = require('express')
const path = require('path')
const fs = require('fs')
const admin = require('firebase-admin')
const fetch = require('node-fetch')
const multer = require('multer')

const COVERS_DIR = path.join(__dirname, '../public/covers')
fs.mkdirSync(COVERS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COVERS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('File must be an image'))
  },
})

// --- Firebase Admin init ---
// In Easy Panel: set FIREBASE_SERVICE_ACCOUNT to the base64-encoded service account JSON.
// Locally: place service-account.json in the project root.
let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Strip whitespace/newlines that can appear when copying base64 strings
  const cleaned = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\s/g, '')
  serviceAccount = JSON.parse(Buffer.from(cleaned, 'base64').toString('utf8'))
} else {
  try {
    serviceAccount = require('../service-account.json')
  } catch {
    console.error('No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT env var.')
    process.exit(1)
  }
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const app = express()
app.use(express.json())

// --- Discord OAuth → Firebase custom token ---
app.post('/api/discord-auth', async (req, res) => {
  const { code, redirectUri } = req.body

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'code and redirectUri are required' })
  }

  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Discord credentials not configured' })
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('Discord token exchange failed:', err)
      return res.status(401).json({ error: 'Discord token exchange failed' })
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return res.status(401).json({ error: 'No access token returned by Discord' })
    }

    // Get Discord user
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Failed to fetch Discord user' })
    }

    const discordUser = await userRes.json()

    if (!discordUser.id || !discordUser.username) {
      return res.status(401).json({ error: 'Invalid Discord user response' })
    }

    // Check guild membership if a guild ID is configured
    const configDoc = await db.doc('config/main').get()
    const discordGuildId = configDoc.exists ? configDoc.data().discordGuildId : null

    if (discordGuildId) {
      const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!guildsRes.ok) {
        return res.status(401).json({ error: 'Failed to fetch Discord guilds' })
      }

      const guilds = await guildsRes.json()

      if (!guilds.some(g => g.id === discordGuildId)) {
        return res.status(403).json({
          error: 'You must be a member of the family Discord server to access the admin panel.',
          code: 'permission-denied',
        })
      }
    }

    // Create Firebase custom token
    const uid = `discord:${discordUser.id}`
    const token = await admin.auth().createCustomToken(uid, {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
    })

    return res.json({ token })
  } catch (err) {
    console.error('discord-auth error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// --- Discord webhook proxy ---
app.post('/api/send-webhook', async (req, res) => {
  const { name, message } = req.body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' })
  }

  try {
    const configDoc = await db.doc('config/main').get()
    const webhookUrl = configDoc.exists ? configDoc.data().discordWebhookUrl : null

    if (!webhookUrl) {
      return res.status(404).json({ error: 'Webhook not configured' })
    }

    const safeName = name.replace(/@/g, '@ ').trim().slice(0, 100)
    const safeMessage = (message || '').replace(/@/g, '@ ').trim().slice(0, 500)

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `📚 **Audiobook Access Request**\n**Name:** ${safeName}\n**Message:** ${safeMessage || '(none)'}`,
      }),
    })

    if (!webhookRes.ok) {
      const err = await webhookRes.text()
      console.error('Discord webhook failed:', err)
      return res.status(500).json({ error: 'Failed to send webhook' })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('send-webhook error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// --- New suggestion → Discord embed ---
app.post('/api/suggest-webhook', async (req, res) => {
  const webhookUrl = process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL
  if (!webhookUrl) {
    // Silently succeed if not configured so the frontend doesn't error
    return res.json({ ok: true, skipped: true })
  }

  const { title, author, description, coverUrl, genres, suggestedBy } = req.body

  const safeTitle = String(title || 'Untitled').slice(0, 200)
  const safeAuthor = String(author || 'Unknown').slice(0, 100)
  const safeDescription = String(description || '').slice(0, 1800)
  const safeSuggestedBy = String(suggestedBy || '').replace(/@/g, '@ ').slice(0, 100)

  const genreLine = Array.isArray(genres) && genres.length
    ? genres.map(g => `\`${g}\``).join(' ')
    : null

  const embedDescription = [safeDescription, genreLine].filter(Boolean).join('\n\n')

  const embed = {
    title: `${safeTitle} — ${safeAuthor}`,
    description: embedDescription,
    color: 0xC8963C,
  }

  if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
    embed.image = { url: coverUrl }
  }

  if (safeSuggestedBy) {
    embed.footer = { text: `📖 Suggested by ${safeSuggestedBy}` }
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!webhookRes.ok) {
      const err = await webhookRes.text()
      console.error('Suggestions webhook failed:', err)
      return res.status(500).json({ error: 'Failed to send webhook' })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('suggest-webhook error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// --- Discord channel list (for admin channel picker) ---
app.get('/api/discord-channels', async (req, res) => {
  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) return res.status(404).json({ error: 'Discord bot not configured' })

  const guildId = process.env.DISCORD_GUILD_ID
  if (!guildId) return res.status(400).json({ error: 'No guild ID configured. Set DISCORD_GUILD_ID.' })

  const headers = { Authorization: `Bot ${botToken}` }
  // Map named categories to env vars so IDs are never exposed to the frontend
  const categoryMap = {
    finished: process.env.DISCORD_FINISHED_CATEGORY_ID,
    current:  process.env.DISCORD_CURRENT_CATEGORY_ID,
  }
  const categoryKey = req.query.category
  const categoryId = (categoryKey && categoryMap[categoryKey]) || process.env.DISCORD_BOOK_CATEGORY_ID || null

  try {
    const res2 = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers })
    if (!res2.ok) {
      const err = await res2.text()
      console.error('Discord channels fetch failed:', err)
      return res.status(res2.status).json({ error: 'Could not fetch channels — check bot permissions and guild ID' })
    }
    const allChannels = await res2.json()

    // Type 0 = GUILD_TEXT, Type 15 = GUILD_FORUM; optionally filter by parent category
    const channels = allChannels
      .filter(c => (c.type === 0 || c.type === 15) && (!categoryId || c.parent_id === categoryId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(c => ({
        id: c.id,
        name: c.name,
        url: `https://discord.com/channels/${guildId}/${c.id}`,
      }))

    return res.json({ channels })
  } catch (err) {
    console.error('discord-channels error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// --- Discord book-promotion automation ---
// Creates a forum channel for the new book, populates it with starter threads,
// and optionally moves the previous book's channel to the finished category.
app.post('/api/discord-promote-book', async (req, res) => {
  const botToken = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID
  const currentCategoryId = process.env.DISCORD_CURRENT_CATEGORY_ID
  const finishedCategoryId = process.env.DISCORD_FINISHED_CATEGORY_ID

  if (!botToken || !guildId || !currentCategoryId) {
    return res.status(500).json({ error: 'DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, and DISCORD_CURRENT_CATEGORY_ID are required' })
  }

  const { bookTitle, bookAuthor, previousChannelId } = req.body
  if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return res.status(400).json({ error: 'bookTitle is required' })
  }

  const title = bookTitle.trim()
  const author = (bookAuthor || '').trim()
  const headers = { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' }

  function dApi(method, path, body) {
    return fetch(`https://discord.com/api/v10${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(r => r.json().then(b => ({ ok: r.ok, status: r.status, body: b })))
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

  try {
    // 1. Create forum channel in the current-books category
    const channelName = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 100)
    const channelRes = await dApi('POST', `/guilds/${guildId}/channels`, {
      name: channelName,
      type: 15, // GUILD_FORUM
      parent_id: currentCategoryId,
      topic: author ? `${title} by ${author}` : title,
    })
    if (!channelRes.ok) {
      return res.status(500).json({ error: 'Failed to create Discord channel', details: channelRes.body })
    }
    const channelId = channelRes.body.id
    await sleep(500)

    // 2. Add standard forum tags
    const tagDefs = [
      { name: 'General',    emoji_name: '💬' },
      { name: 'Characters', emoji_name: '👤' },
      { name: 'Background', emoji_name: '🌍' },
      { name: 'Spoilers',   emoji_name: '⚠️' },
      { name: 'Ch. 1–10',   emoji_name: '1️⃣' },
      { name: 'Ch. 11–20',  emoji_name: '2️⃣' },
      { name: 'Ch. 21–30',  emoji_name: '3️⃣' },
      { name: 'Ch. 31–40',  emoji_name: '4️⃣' },
      { name: 'Finished',   emoji_name: '📚' },
    ]
    const tagRes = await dApi('PATCH', `/channels/${channelId}`, { available_tags: tagDefs })
    const tagMap = {}
    if (tagRes.ok && tagRes.body.available_tags) {
      for (const t of tagRes.body.available_tags) tagMap[t.name] = t.id
    }
    await sleep(500)

    // 3. Look up current book data from Firestore for character list
    const configDoc = await db.doc('config/main').get()
    const book = (configDoc.exists && configDoc.data().currentBook) || {}
    const characters = Array.isArray(book.characters) ? book.characters : []

    // 4. Build starter thread definitions
    const starterThreads = [
      {
        name: 'So Far',
        tags: [tagMap['General']].filter(Boolean),
        content: `Use this thread to share your thoughts as you read — vibes, reactions, confusion, excitement, all welcome.\n\nA few gentle rules:\n🔒 No major spoilers — keep it vague if you're ahead of others\n📚 Drop in wherever you are, no need to have finished\n😵 "I have no idea what's going on but I'm intrigued" is a completely valid update\n\nWhere are you in the book and what are you thinking so far?`,
      },
      {
        name: 'Discussion Questions',
        tags: [tagMap['General']].filter(Boolean),
        content: `Some questions to kick off discussion — no pressure to answer all of them!\n\n**1.** What were your first impressions? Did the writing style and world-building draw you in or take some adjustment?\n\n**2.** Which character did you connect with most? Which surprised you?\n\n**3.** How did you feel about the pacing? Were there sections that dragged or sections you couldn't put down?\n\n**4.** What do you think the book is ultimately *about* — beyond the plot?\n\n**5.** ⚠️ *Finish the book before answering:* What did the ending mean to you? Were you satisfied?`,
      },
      {
        name: 'Themes',
        tags: [tagMap['Background']].filter(Boolean),
        content: `Some of the big ideas running through *${title}*:\n\n💬 **Add themes as the group discovers them!**\n\nAs you read, drop themes you notice here — motifs, recurring imagery, questions the book seems to be asking. We'll build this thread out together.`,
      },
      {
        name: 'Additional Resources',
        tags: [tagMap['Background']].filter(Boolean),
        content: `Links, articles, and context for *${title}*${author ? ` by ${author}` : ''}.\n\nShare anything you find helpful: author interviews, genre context, historical background, related reading. No spoilers in titles please — use a spoiler tag if the link itself contains them.`,
      },
    ]

    // Add characters thread if book data is available
    if (characters.length > 0) {
      const lines = characters.map(c => `**${c.name}** — ${c.description || 'No description yet.'}`).join('\n')
      const intro = `A guide to the characters of *${title}*. Minor spoilers for introductions only.\n\n`
      const chunks = []
      let current = intro
      for (const line of lines.split('\n')) {
        if (current.length + line.length + 1 > 1950) {
          chunks.push(current)
          current = line + '\n'
        } else {
          current += line + '\n'
        }
      }
      if (current.trim()) chunks.push(current)
      starterThreads.splice(1, 0, {
        name: 'Characters',
        tags: [tagMap['Characters']].filter(Boolean),
        content: chunks[0],
        extraMessages: chunks.slice(1),
      })
    }

    // 5. Create threads
    const createdThreads = []
    for (const def of starterThreads) {
      await sleep(1200)
      const threadRes = await dApi('POST', `/channels/${channelId}/threads`, {
        name: def.name,
        auto_archive_duration: 10080,
        applied_tags: def.tags,
        message: { content: def.content },
      })
      if (!threadRes.ok) {
        console.error(`Failed to create thread "${def.name}":`, threadRes.body)
        continue
      }
      const threadId = threadRes.body.id
      for (const extra of (def.extraMessages || [])) {
        await sleep(800)
        await dApi('POST', `/channels/${threadId}/messages`, { content: extra })
      }
      createdThreads.push({
        name: def.name,
        id: threadId,
        url: `https://discord.com/channels/${guildId}/${threadId}`,
      })
    }

    // 6. Move old channel to finished category if provided
    if (previousChannelId && finishedCategoryId) {
      await sleep(500)
      await dApi('PATCH', `/channels/${previousChannelId}`, { parent_id: finishedCategoryId })
    }

    return res.json({
      channelId,
      channelUrl: `https://discord.com/channels/${guildId}/${channelId}`,
      threads: createdThreads,
    })
  } catch (err) {
    console.error('discord-promote-book error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// --- Cover image upload ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/covers/${req.file.filename}` })
})

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err?.message === 'File must be an image') {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// --- Serve Vue SPA ---
const distPath = path.join(__dirname, '../dist')
app.use('/covers', express.static(COVERS_DIR))
app.use(express.static(distPath))
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
