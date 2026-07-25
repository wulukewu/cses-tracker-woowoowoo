import type { ProblemStatsResponse } from '~~/shared/types'
import { loadProblemStats } from '~~/server/utils/refresh'
import { getWeek, listWeeks } from '~~/server/utils/blobs'

export default defineEventHandler(async (event): Promise<ProblemStatsResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null
  if (!week) return {}

  const config = useRuntimeConfig()

  return await loadProblemStats(week, config.csesSessionCookie, { force, event })
})
