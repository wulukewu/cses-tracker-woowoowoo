import { getStore } from './netlifyBlobs'

interface CacheEntry<T> {
  value: T
  expiresAt: number
  /** When this entry was stored, used to avoid overwriting a newer result. */
  writtenAt?: number
}

function cacheStore() {
  return getStore('submissions-cache')
}

// In-flight promise deduplication to prevent concurrent duplicate scrapes or I/O clashes
const activePromises = new Map<string, Promise<any>>()

/**
 * Returns the platform's real `waitUntil`, or null when the runtime has none.
 *
 * Nitro always defines `event.waitUntil`, so its presence proves nothing. When
 * the preset has no platform support — as with the Netlify functions preset,
 * whose handler never populates `event.context.waitUntil` — Nitro's version only
 * pushes the promise onto `event.context.nitro._waitUntilPromises`, an array
 * that nothing in Nitro ever awaits. The revalidation is then plain
 * fire-and-forget inside a container the platform may freeze the moment the
 * response is sent, so it can die halfway through, or thaw much later and store
 * a result it scraped long ago on top of newer data.
 *
 * Only `event.context.waitUntil` is actually backed by the platform, so that is
 * what we probe for; without it the caller revalidates synchronously instead.
 */
function platformWaitUntil(event: any): ((promise: Promise<unknown>) => void) | null {
  const fn = event?.context?.waitUntil
  return typeof fn === 'function' ? (promise) => fn.call(event.context, promise) : null
}

/**
 * Persisted cache in Netlify Blobs.
 * Revalidates in the background (SWR) only where the runtime can keep the work
 * alive past the response; otherwise it refreshes synchronously.
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
      if (hit.expiresAt > Date.now()) {
        return hit.value
      }

      const waitUntil = options?.event ? platformWaitUntil(options.event) : null
      if (waitUntil) {
        // SWR: serve the stale value now and revalidate in the background, with
        // the platform holding the container open until that work settles.
        waitUntil(
          runAndCache(key, ttlMs, fn, store).catch((err) => {
            console.error(`[blobCache] SWR revalidation failed for key ${key}:`, err)
          }),
        )
        return hit.value
      }
      // Otherwise fall through and refresh synchronously: a slower response is
      // better than a revalidation the runtime is free to freeze mid-flight.
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
    const startedAt = Date.now()
    promise = fn()
      .then(async (value) => {
        // Another writer — a concurrent serverless instance, or a revalidation
        // that was frozen and resumed — may have stored a result since this
        // fetch began. Theirs is based on a later read of CSES than ours, so
        // leave it alone rather than reverting the key to our older scrape.
        const current = (await store.get(key, { type: 'json' })) as CacheEntry<T> | null
        if (!current || (current.writtenAt ?? 0) <= startedAt) {
          const now = Date.now()
          await store.setJSON(key, {
            value,
            expiresAt: now + ttlMs,
            writtenAt: now,
          } satisfies CacheEntry<T>)
        }
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
