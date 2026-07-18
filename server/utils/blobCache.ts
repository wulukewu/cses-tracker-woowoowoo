import { getStore } from './netlifyBlobs'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

function cacheStore() {
  return getStore('submissions-cache')
}

// In-flight promise deduplication to prevent concurrent duplicate scrapes or I/O clashes
const activePromises = new Map<string, Promise<any>>()

/**
 * Persisted cache in Netlify Blobs.
 * Supports Stale-While-Revalidate (SWR) if the `event` option is provided.
 */
export async function cachedBlob<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  options?: { force?: boolean; event?: any },
): Promise<T> {
  const store = cacheStore()

  if (!options?.force) {
    const hit = (await store.get(key, { type: 'json' })) as CacheEntry<T> | null
    if (hit) {
      const isExpired = hit.expiresAt <= Date.now()

      if (isExpired && options?.event) {
        // SWR Mode: Kick off a background revalidation task that runs after the response
        // is sent, ensuring Serverless environments do not freeze before execution.
        const revalidatePromise = (async () => {
          try {
            await runAndCache(key, ttlMs, fn, store)
          } catch (err) {
            console.error(`[blobCache] SWR revalidation failed for key ${key}:`, err)
          }
        })()

        options.event.waitUntil(revalidatePromise)
        return hit.value
      }

      if (!isExpired) {
        return hit.value
      }
    }
  }

  return await runAndCache(key, ttlMs, fn, store)
}

async function runAndCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  store: any,
): Promise<T> {
  let promise = activePromises.get(key)
  if (!promise) {
    promise = fn()
      .then(async (value) => {
        await store.setJSON(key, { value, expiresAt: Date.now() + ttlMs } satisfies CacheEntry<T>)
        activePromises.delete(key)
        return value
      })
      .catch((err) => {
        activePromises.delete(key)
        throw err
      })
    activePromises.set(key, promise)
  }
  return promise
}
