const CACHE_TTL_MS = 7 * 60 * 1000
const MAX_SIZE = 100

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
  if (store.size >= MAX_SIZE) {
    const oldest = store.keys().next().value
    if (oldest) store.delete(oldest)
  }
  store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}
