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

  return await cachedBlob(
    `problem-stats-week:${week.id}`,
    TTL_MS,
    async () => {
      const result: ProblemStatsResponse = {}
      await Promise.all(
        week.problems.map(async (problem) => {
          const stats = await cachedBlob(
            `problem-stats:${problem.id}`,
            TTL_MS,
            () => fetchProblemStats(problem.id, sessionCookie),
            { force },
          )
          if (stats) result[String(problem.id)] = stats
        }),
      )
      return result
    },
    { force, event },
  )
})
