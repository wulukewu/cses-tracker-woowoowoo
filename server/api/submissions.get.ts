import { USERS } from '~~/shared/users'
import type { SubmissionsResponse } from '~~/shared/types'
import { fetchSubmissionSummary } from '~~/server/utils/cses'
import { cachedBlob } from '~~/server/utils/blobCache'
import { getWeek, listWeeks } from '~~/server/utils/blobs'

const TTL_MS = 6 * 60 * 60 * 1000

export default defineEventHandler(async (event): Promise<SubmissionsResponse> => {
  const query = getQuery(event)
  const weekId = typeof query.week === 'string' ? query.week : undefined
  const force = query.force === 'true' || query.force === '1'

  const week = weekId ? await getWeek(weekId) : (await listWeeks())[0] ?? null
  if (!week) return {}

  const config = useRuntimeConfig()
  const sessionCookie = config.csesSessionCookie

  // No outer per-week cache: it only memoised an in-memory assembly of the inner
  // per-user results, but its SWR revalidation read the (also-stale) inner caches
  // and froze their stale values back into itself, so fresh inner data could be
  // masked for a full TTL. Assemble live from the inner caches instead; the inner
  // cache still absorbs every CSES fetch. The `:v2:` prefix retires pre-fix keys
  // holding duplicated rows.
  const result: SubmissionsResponse = {}
  await Promise.all(
    week.problems.map(async (problem) => {
      const perUser = await Promise.all(
        USERS.map(async (user) => {
          const summary = await cachedBlob(
            `submissions:v2:${problem.id}:${user.name}`,
            TTL_MS,
            () => fetchSubmissionSummary(problem.id, user.name, sessionCookie),
            { force, event },
          )
          return [user.name, summary] as const
        }),
      )
      result[String(problem.id)] = Object.fromEntries(perUser)
    }),
  )
  return result
})
