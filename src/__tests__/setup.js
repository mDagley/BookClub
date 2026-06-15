import { vi } from 'vitest'

// Default fetch stub — tests override with vi.mocked(fetch).mockResolvedValueOnce(...)
global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
)
