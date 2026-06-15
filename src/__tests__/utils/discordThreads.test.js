import { primaryThreadUrl } from '../../utils/discordThreads.js'

describe('primaryThreadUrl', () => {
  it('returns the first thread with a valid URL', () => {
    const book = { discordThreads: [{ title: 'Discussion', url: 'https://discord.com/channels/1/2' }] }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/2')
  })

  it('skips whitespace-only URLs and returns the first valid one', () => {
    const book = {
      discordThreads: [
        { title: 'Empty', url: '   ' },
        { title: 'Valid', url: 'https://discord.com/channels/1/3' },
      ],
    }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/3')
  })

  it('trims whitespace from the returned URL', () => {
    const book = { discordThreads: [{ url: '  https://discord.com/channels/1/2  ' }] }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/2')
  })

  it('falls back to legacy discordThreadUrl when threads array is empty', () => {
    const book = { discordThreads: [], discordThreadUrl: 'https://discord.com/channels/1/legacy' }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/legacy')
  })

  it('falls back to legacy discordThreadUrl when discordThreads is absent', () => {
    const book = { discordThreadUrl: 'https://discord.com/channels/1/legacy' }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/legacy')
  })

  it('returns null when there are no valid URLs anywhere', () => {
    expect(primaryThreadUrl({})).toBeNull()
    expect(primaryThreadUrl({ discordThreads: [] })).toBeNull()
    expect(primaryThreadUrl({ discordThreads: [{ url: '' }, { url: '  ' }] })).toBeNull()
  })

  it('prefers discordThreads over legacy discordThreadUrl', () => {
    const book = {
      discordThreads: [{ url: 'https://discord.com/channels/1/new' }],
      discordThreadUrl: 'https://discord.com/channels/1/legacy',
    }
    expect(primaryThreadUrl(book)).toBe('https://discord.com/channels/1/new')
  })
})
