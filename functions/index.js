const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

admin.initializeApp()

exports.discordAuth = functions.https.onCall(async (data, context) => {
  const { code, redirectUri } = data

  if (!code || !redirectUri) {
    throw new functions.https.HttpsError('invalid-argument', 'code and redirectUri are required')
  }

  const clientId = functions.config().discord.client_id
  const clientSecret = functions.config().discord.client_secret

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
    throw new functions.https.HttpsError('unauthenticated', `Discord token exchange failed: ${err}`)
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  // Get Discord user info
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    throw new functions.https.HttpsError('unauthenticated', 'Failed to fetch Discord user')
  }

  const discordUser = await userRes.json()

  // Verify guild membership
  const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!guildsRes.ok) {
    throw new functions.https.HttpsError('unauthenticated', 'Failed to fetch Discord guilds')
  }

  const guilds = await guildsRes.json()

  // Read configured guild ID from Firestore /config
  const configDoc = await admin.firestore().doc('config/main').get()
  const discordGuildId = configDoc.exists ? configDoc.data().discordGuildId : null

  if (discordGuildId && !guilds.some(g => g.id === discordGuildId)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must be a member of the family Discord server to access the admin panel.'
    )
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
