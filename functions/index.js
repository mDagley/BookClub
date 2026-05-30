const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

admin.initializeApp()

exports.discordAuth = functions.https.onCall(async (data) => {
  const { code, redirectUri } = data

  if (!code || !redirectUri) {
    throw new functions.https.HttpsError('invalid-argument', 'code and redirectUri are required')
  }

  let clientId, clientSecret
  try {
    clientId = functions.config().discord.client_id
    clientSecret = functions.config().discord.client_secret
  } catch {
    throw new functions.https.HttpsError('internal', 'Discord credentials not configured')
  }

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
    throw new functions.https.HttpsError('unauthenticated', 'Discord token exchange failed')
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  if (!accessToken) {
    throw new functions.https.HttpsError('unauthenticated', 'No access token returned by Discord')
  }

  // Get Discord user info
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    throw new functions.https.HttpsError('unauthenticated', 'Failed to fetch Discord user')
  }

  const discordUser = await userRes.json()

  if (!discordUser.id || !discordUser.username) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid Discord user response')
  }

  // Read configured guild ID first — only fetch guilds if one is configured
  const configDoc = await admin.firestore().doc('config/main').get()
  const discordGuildId = configDoc.exists ? configDoc.data().discordGuildId : null

  if (discordGuildId) {
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!guildsRes.ok) {
      throw new functions.https.HttpsError('unauthenticated', 'Failed to fetch Discord guilds')
    }

    const guilds = await guildsRes.json()

    if (!guilds.some(g => g.id === discordGuildId)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be a member of the family Discord server to access the admin panel.'
      )
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

  return { token }
})

// Proxy Discord webhook POST to avoid CORS restrictions in the browser.
// Reads the webhook URL from Firestore so it's never exposed client-side.
exports.sendWebhook = functions.https.onCall(async (data) => {
  const { name, message } = data

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'name is required')
  }

  const configDoc = await admin.firestore().doc('config/main').get()
  const webhookUrl = configDoc.exists ? configDoc.data().discordWebhookUrl : null

  if (!webhookUrl) {
    throw new functions.https.HttpsError('not-found', 'Webhook not configured')
  }

  // Strip Discord @mentions to prevent ping abuse
  const safeName = name.replace(/@/g, '@ ').trim().slice(0, 100)
  const safeMessage = (message || '').replace(/@/g, '@ ').trim().slice(0, 500)

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `📚 **Audiobook Access Request**\n**Name:** ${safeName}\n**Message:** ${safeMessage || '(none)'}`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Discord webhook failed:', err)
    throw new functions.https.HttpsError('internal', 'Failed to send webhook')
  }

  return { ok: true }
})
