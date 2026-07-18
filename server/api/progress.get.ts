import { USERS } from '~~/shared/users'
import type { ProgressResponse, UserProgress } from '~~/shared/types'
import { fetchSolvedTaskIds, CsesSessionExpiredError } from '~~/server/utils/cses'
import { cachedBlob } from '~~/server/utils/blobCache'
import { getWeek, listWeeks, getStaleSince, setStaleSince } from '~~/server/utils/blobs'

const PROGRESS_TTL_MS = 10 * 60 * 1000 // 10 minutes

export default defineEventHandler(async (event): Promise<ProgressResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null

  const config = useRuntimeConfig()
  const sessionCookie = config.csesSessionCookie

  let expired = false

  const users: UserProgress[] = await Promise.all(
    USERS.map(async (user) => {
      try {
        const solvedIds = await cachedBlob(
          `solved:${user.csesId}`,
          PROGRESS_TTL_MS,
          () => fetchSolvedTaskIds(user.csesId, sessionCookie),
          { force, event },
        )
        return { name: user.name, csesId: user.csesId, solvedIds }
      } catch (err) {
        if (err instanceof CsesSessionExpiredError) {
          expired = true
          return { name: user.name, csesId: user.csesId, solvedIds: [] }
        } else {
          throw err
        }
      }
    }),
  )

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
