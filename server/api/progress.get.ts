import type { ProgressResponse } from '~~/shared/types'
import { loadProgress } from '~~/server/utils/refresh'
import { getWeek, listWeeks, getStaleSince, setStaleSince } from '~~/server/utils/blobs'

export default defineEventHandler(async (event): Promise<ProgressResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null

  const config = useRuntimeConfig()

  const { users, expired } = await loadProgress(config.csesSessionCookie, { force, event })

  let staleSince = await getStaleSince()
  if (expired && !staleSince) {
    staleSince = new Date().toISOString()
    await setStaleSince(staleSince)
  } else if (!expired && staleSince) {
    staleSince = null
    await setStaleSince(null)
  }

  return { week, users, staleSince }
})
