/**
 * Maps over `items` while keeping at most `limit` calls in flight.
 *
 * Used for the CSES scrapes: a week's worth of problems times the tracked users
 * is enough work that an unbounded `Promise.all` would open dozens of sockets to
 * cses.fi at once. A burst like that is far more likely to be throttled — or
 * read as hostile — than the same requests paced out, and the account being
 * rate-limited would take the whole tracker down with it.
 *
 * Results keep the order of `items`, matching `Promise.all`.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []

  const results = new Array<R>(items.length)
  let next = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++
      if (index >= items.length) return
      results[index] = await fn(items[index]!, index)
    }
  })

  await Promise.all(workers)
  return results
}
