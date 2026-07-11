import { getStore } from '@netlify/blobs'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

function cacheStore() {
  return getStore('submissions-cache')
}

/**
 * Like `cached()` in cache.ts but persisted in Netlify Blobs instead of
 * in-memory, so it survives cold starts. Used for CSES queue-page data, which
 * changes rarely enough to tolerate a multi-hour TTL.
 */
export async function cachedBlob<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const store = cacheStore()
  const hit = (await store.get(key, { type: 'json' })) as CacheEntry<T> | null
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value
  }
  const value = await fn()
  await store.setJSON(key, { value, expiresAt: Date.now() + ttlMs } satisfies CacheEntry<T>)
  return value
}
