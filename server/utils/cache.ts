const CACHE_TTL_MS = 7 * 60 * 1000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export async function cached<T>(key: string, fn: () => Promise<T>, options?: { force?: boolean }): Promise<T> {
  if (!options?.force) {
    const hit = store.get(key)
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T
    }
  }
  const value = await fn()
  store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}
