import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()

vi.mock('./netlifyBlobs', () => ({
  getStore: () => ({
    async get(key: string, options?: { type?: 'text' | 'json' }) {
      const raw = store.get(key)
      if (raw === undefined) return null
      return options?.type === 'json' ? JSON.parse(raw) : raw
    },
    async setJSON(key: string, value: any) {
      store.set(key, JSON.stringify(value))
    },
  }),
}))

const { cachedBlob } = await import('./blobCache')

/** An event whose runtime backs waitUntil, as Cloudflare or Deno Deploy would. */
function eventWithPlatformWaitUntil() {
  const promises: Promise<unknown>[] = []
  return {
    event: { context: { waitUntil: (p: Promise<unknown>) => promises.push(p) } },
    settle: () => Promise.allSettled(promises),
  }
}

/**
 * An event shaped like the one Nitro hands a Netlify function: `waitUntil` is
 * defined, but it only pushes onto an array nothing awaits, so nothing keeps a
 * background task alive.
 */
function eventWithNitroFallbackWaitUntil() {
  const parked: Promise<unknown>[] = []
  return {
    event: { waitUntil: (p: Promise<unknown>) => parked.push(p), context: { nitro: {} } },
    parked,
  }
}

beforeEach(() => {
  store.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cachedBlob', () => {
  it('calls fn once and serves the cached value while it is fresh', async () => {
    const fn = vi.fn().mockResolvedValue('value')

    expect(await cachedBlob('k', 60_000, fn)).toBe('value')
    expect(await cachedBlob('k', 60_000, fn)).toBe('value')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('bypasses a fresh entry when force is set', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    expect(await cachedBlob('k', 60_000, fn)).toBe('first')
    expect(await cachedBlob('k', 60_000, fn, { force: true })).toBe('second')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('refreshes synchronously when the runtime has no platform waitUntil', async () => {
    // Netlify's case: returning stale here would strand the refresh in a
    // container the platform may freeze, so the expired read must block.
    const fn = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new')
    const { event, parked } = eventWithNitroFallbackWaitUntil()

    expect(await cachedBlob('k', 10, fn, { event })).toBe('old')
    await new Promise((r) => setTimeout(r, 20))

    expect(await cachedBlob('k', 10, fn, { event })).toBe('new')
    expect(parked).toHaveLength(0)
  })

  it('serves stale and revalidates in the background when the platform backs waitUntil', async () => {
    const fn = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new')
    const { event, settle } = eventWithPlatformWaitUntil()

    expect(await cachedBlob('k', 10, fn, { event })).toBe('old')
    await new Promise((r) => setTimeout(r, 20))

    // The stale value is served immediately; the refresh lands afterwards.
    expect(await cachedBlob('k', 10, fn, { event })).toBe('old')
    await settle()
    expect(await cachedBlob('k', 10, fn, { event })).toBe('new')
  })

  it('does not overwrite an entry written by another writer after this fetch began', async () => {
    // Models a revalidation that was frozen mid-flight and thawed later: by the
    // time it resolves, a newer scrape is already stored and must survive.
    await cachedBlob('k', 60_000, async () => 'seed')

    let release: (v: string) => void = () => {}
    const slow = cachedBlob('other-key-to-avoid-dedupe', 60_000, async () => 'x')
    await slow

    const stalled = cachedBlob('k', 60_000, () => new Promise<string>((r) => { release = r }), {
      force: true,
    })

    // A newer write lands while the scrape above is still in flight.
    await new Promise((r) => setTimeout(r, 5))
    store.set('k', JSON.stringify({ value: 'newer', expiresAt: Date.now() + 60_000, writtenAt: Date.now() }))

    release('older-scrape')
    await stalled

    const stored = JSON.parse(store.get('k')!)
    expect(stored.value).toBe('newer')
  })
})
