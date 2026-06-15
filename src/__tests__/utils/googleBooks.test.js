import { betterCoverUrl, mapCategoriesToGenres } from '../../utils/googleBooks.js'

// Sample URL as returned by the Google Books API
const SAMPLE_URL = 'http://books.google.com/books/content?id=XYZ123&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'

describe('betterCoverUrl', () => {
  it('returns null for null or empty input', () => {
    expect(betterCoverUrl(null)).toBeNull()
    expect(betterCoverUrl('')).toBeNull()
    expect(betterCoverUrl(undefined)).toBeNull()
  })

  it('upgrades http to https', () => {
    expect(betterCoverUrl(SAMPLE_URL)).toMatch(/^https:\/\//)
  })

  it('removes the edge=curl page-curl decoration', () => {
    const result = betterCoverUrl(SAMPLE_URL)
    expect(result).not.toContain('edge=curl')
    expect(result).not.toContain('edge=')
  })

  it('sets zoom to 3 regardless of original zoom value', () => {
    const result = betterCoverUrl(SAMPLE_URL)
    expect(result).toContain('zoom=3')
    expect(result).not.toContain('zoom=1')
  })

  it('adds fife=w480 for high-resolution CDN serving', () => {
    expect(betterCoverUrl(SAMPLE_URL)).toContain('fife=w480')
  })

  it('does not duplicate fife= if already present', () => {
    const alreadyHasFife = SAMPLE_URL + '&fife=w200'
    const result = betterCoverUrl(alreadyHasFife)
    expect((result.match(/fife=/g) ?? []).length).toBe(1)
    expect(result).toContain('fife=w480')
  })

  it('does not duplicate zoom= if already set to 3', () => {
    const url = 'http://books.google.com/books/content?id=XYZ&zoom=3'
    const result = betterCoverUrl(url)
    expect((result.match(/zoom=/g) ?? []).length).toBe(1)
  })

  it('returns https URL unchanged (minus edge/fife) for already-https input', () => {
    const httpsUrl = SAMPLE_URL.replace('http://', 'https://')
    const result = betterCoverUrl(httpsUrl)
    expect(result).toMatch(/^https:\/\//)
    expect(result).toContain('fife=w480')
  })
})

describe('mapCategoriesToGenres', () => {
  it('maps known category strings to genre names', () => {
    expect(mapCategoriesToGenres(['Science Fiction'])).toContain('SciFi')
    expect(mapCategoriesToGenres(['Horror'])).toContain('Horror')
    expect(mapCategoriesToGenres(['Romance'])).toContain('Romance')
    expect(mapCategoriesToGenres(['Mystery'])).toContain('Mystery')
  })

  it('extracts genres from description text when categories are empty', () => {
    expect(mapCategoriesToGenres([], 'a dystopian future society')).toContain('Dystopian')
    expect(mapCategoriesToGenres([], 'a story involving magic and wizardry')).toContain('Magic')
    expect(mapCategoriesToGenres([], 'a thrilling mystery')).toContain('Mystery')
  })

  it('combines genres from both categories and description', () => {
    const result = mapCategoriesToGenres(['Horror'], 'with dark academia overtones')
    expect(result).toContain('Horror')
    expect(result).toContain('Dark Academia')
  })

  it('deduplicates genres when multiple keywords match the same genre', () => {
    const result = mapCategoriesToGenres(['Fantasy Fiction', 'Fantasy'], 'fantasy adventure')
    expect(result.filter(g => g === 'Fantasy').length).toBe(1)
  })

  it('returns empty array for unrecognized content', () => {
    expect(mapCategoriesToGenres(['Cooking', 'Gardening'], 'a recipe for dinner')).toEqual([])
  })

  it('returns empty array when called with no arguments', () => {
    expect(mapCategoriesToGenres()).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(mapCategoriesToGenres(['SCIENCE FICTION'])).toContain('SciFi')
    expect(mapCategoriesToGenres([], 'A FANTASY WORLD')).toContain('Fantasy')
  })
})
