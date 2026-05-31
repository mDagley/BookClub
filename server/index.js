const express = require('express')
const path = require('path')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

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

// --- Serve Vue SPA ---
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
