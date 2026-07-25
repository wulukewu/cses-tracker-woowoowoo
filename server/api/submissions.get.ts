import type { SubmissionsResponse } from '~~/shared/types'
import { loadSubmissions } from '~~/server/utils/refresh'
import { getWeek, listWeeks } from '~~/server/utils/blobs'

export default defineEventHandler(async (event): Promise<SubmissionsResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null
  if (!week) return {}

  const config = useRuntimeConfig()

  return await loadSubmissions(week, config.csesSessionCookie, { force, event })
})
