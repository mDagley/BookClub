// Reads the git diff of ChangelogPage.vue and posts any newly added entries
// to the Discord #website-updates channel via webhook.
// Called by the GitHub Actions workflow on push to master.

const { execSync } = require('child_process')
const https = require('https')
const { URL } = require('url')

const webhookUrl = process.env.DISCORD_CHANGELOG_WEBHOOK_URL
if (!webhookUrl) {
  console.error('DISCORD_CHANGELOG_WEBHOOK_URL not set')
  process.exit(1)
}

const diff = execSync('git diff HEAD~1 HEAD -- src/pages/ChangelogPage.vue').toString()

if (!diff.trim()) {
  console.log('No changelog diff — skipping')
  process.exit(0)
}

// Extract new entries from added lines in the diff
const entries = []
let date = null

for (const line of diff.split('\n')) {
  if (!line.startsWith('+') || line.startsWith('+++')) continue

  const dateMatch = line.match(/date:\s*'([^']+)'/)
  if (dateMatch) date = dateMatch[1]

  // Match { type: 'feature'|'fix', text: '...' } handling escaped apostrophes
  const entryMatch = line.match(/type:\s*'(feature|fix)',\s*text:\s*'((?:[^'\\]|\\.)*)'/)
  if (entryMatch) {
    entries.push({
      type: entryMatch[1],
      text: entryMatch[2].replace(/\\'/g, "'"),
    })
  }
}

if (!entries.length) {
  console.log('No new entries in diff — skipping')
  process.exit(0)
}

const lines = entries.map(e => `${e.type === 'feature' ? '✨' : '🔧'} ${e.text}`)

const payload = JSON.stringify({
  username: 'Book Club',
  avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
  embeds: [
    {
      title: `📚 Update${date ? ` — ${date}` : ''}`,
      description: lines.join('\n'),
      color: 0xc8a45a,
    },
  ],
})

const parsed = new URL(webhookUrl)
const req = https.request(
  {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  res => {
    console.log(`Discord responded: ${res.statusCode}`)
    process.exit(res.statusCode === 204 ? 0 : 1)
  }
)

req.on('error', err => { console.error(err); process.exit(1) })
req.write(payload)
req.end()
