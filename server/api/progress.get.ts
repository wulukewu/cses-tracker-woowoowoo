import { USERS } from '~~/shared/users'
import type { ProgressResponse, UserProgress } from '~~/shared/types'
import { fetchSolvedTaskIds, CsesSessionExpiredError } from '~~/server/utils/cses'
import { cached } from '~~/server/utils/cache'
import { getWeek, listWeeks, getStaleSince, setStaleSince } from '~~/server/utils/blobs'

export default defineEventHandler(async (event): Promise<ProgressResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null

  const config = useRuntimeConfig()
  const sessionCookie = config.csesSessionCookie

  const users: UserProgress[] = []
  let expired = false

  for (const user of USERS) {
    try {
      const solvedIds = await cached(`solved:${user.csesId}`, () =>
        fetchSolvedTaskIds(user.csesId, sessionCookie),
      )
      users.push({ name: user.name, csesId: user.csesId, solvedIds })
    } catch (err) {
      if (err instanceof CsesSessionExpiredError) {
        expired = true
        users.push({ name: user.name, csesId: user.csesId, solvedIds: [] })
      } else {
        throw err
      }
    }
  }

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
