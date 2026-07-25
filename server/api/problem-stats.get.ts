import type { ProblemStatsResponse } from '~~/shared/types'
import { fetchProblemStats } from '~~/server/utils/cses'
import { cachedBlob } from '~~/server/utils/blobCache'
import { getWeek, listWeeks } from '~~/server/utils/blobs'

const TTL_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event): Promise<ProblemStatsResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null
  if (!week) return {}

  const config = useRuntimeConfig()
  const sessionCookie = config.csesSessionCookie

  // No outer per-week cache: like the submissions endpoint, it only memoised an
  // in-memory assembly, while its revalidation read the also-stale inner entries
  // and froze their stale values back into itself — masking fresh per-problem
  // stats for a full day. Assemble live from the inner caches instead.
  const result: ProblemStatsResponse = {}
  await Promise.all(
    week.problems.map(async (problem) => {
      try {
        const stats = await cachedBlob(
          `problem-stats:${problem.id}`,
          TTL_MS,
          () => fetchProblemStats(problem.id, sessionCookie),
          { force, event },
        )
        if (stats) result[String(problem.id)] = stats
      } catch (err) {
        // A failed scrape leaves this problem's stats out of the response
        // without being cached, so the next request retries rather than
        // showing nothing until the TTL expires a day later.
        console.error(`[problem-stats] failed to load stats for task ${problem.id}:`, err)
      }
    }),
  )
  return result
})
