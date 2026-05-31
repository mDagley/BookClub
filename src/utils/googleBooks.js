const GENRE_KEYWORD_MAP = [
  { keywords: ['dystopia', 'dystopian', 'post-apocalyptic', 'post apocalyptic'], genre: 'Dystopian' },
  { keywords: ['science fiction', 'sci-fi', 'space opera', 'cyberpunk'], genre: 'SciFi' },
  { keywords: ['mystery', 'detective', 'crime', 'noir', 'whodunit'], genre: 'Mystery' },
  { keywords: ['thriller', 'suspense'], genre: 'Thriller' },
  { keywords: ['horror', 'gothic'], genre: 'Horror' },
  { keywords: ['romance', 'romantic'], genre: 'Romance' },
  { keywords: ['cozy'], genre: 'Cozy' },
  { keywords: ['dark academia'], genre: 'Dark Academia' },
  { keywords: ['magic', 'magical realism', 'witch', 'wizard', 'necromancer', 'sorcery'], genre: 'Magic' },
  { keywords: ['humor', 'comedy', 'humorous', 'satire'], genre: 'Humor' },
  { keywords: ['biography', 'autobiography', 'memoir'], genre: 'Biography' },
  { keywords: ['nonfiction', 'non-fiction', 'non fiction', 'true crime', 'history', 'self-help'], genre: 'Non Fiction' },
  { keywords: ['classic', 'classics', 'literary classic'], genre: 'Classic' },
  { keywords: ['lgbtq', 'lgbt', 'queer'], genre: 'LGBT+' },
  { keywords: ['activism', 'social justice', 'political'], genre: 'Activism' },
  { keywords: ['fantasy'], genre: 'Fantasy' },
]

function mapCategoriesToGenres(categories = []) {
  const seen = new Set()
  const genres = []
  const haystack = categories.map(c => c.toLowerCase()).join(' ')
  for (const { keywords, genre } of GENRE_KEYWORD_MAP) {
    if (seen.has(genre)) continue
    if (keywords.some(k => haystack.includes(k))) {
      seen.add(genre)
      genres.push(genre)
    }
  }
  return genres
}

function buildCoverUrl(thumbnail) {
  if (!thumbnail) return null
  return thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=2')
}

async function queryGoogleBooks(title, author) {
  if (!title) return null
  const q = encodeURIComponent(`intitle:${title}${author ? ` inauthor:${author}` : ''}`)
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0]?.volumeInfo ?? null
}

// Returns full book metadata from Google Books.
// Only fields that could be found are set; missing fields are null / [].
export async function fetchBookMetadata(title, author) {
  try {
    const info = await queryGoogleBooks(title, author)
    if (!info) return null

    const rawDesc = info.description || ''
    // First paragraph (or first 220 chars) as short synopsis
    const firstPara = rawDesc.split(/\n\n|\r\n\r\n/)[0].trim()
    const synopsis = firstPara.length > 220
      ? firstPara.slice(0, 217) + '…'
      : firstPara || null

    return {
      coverUrl: buildCoverUrl(info.imageLinks?.thumbnail),
      synopsis,
      fullDescription: rawDesc || null,
      genres: mapCategoriesToGenres(info.categories),
    }
  } catch {
    return null
  }
}

// Kept for backward-compat (used by SuggestModal background cover update).
export async function fetchCoverUrl(title, author) {
  const meta = await fetchBookMetadata(title, author)
  return meta?.coverUrl ?? null
}
