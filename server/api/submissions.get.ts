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

  return await cachedBlob(
    `submissions-week:${week.id}`,
    TTL_MS,
    async () => {
      const result: SubmissionsResponse = {}
      await Promise.all(
        week.problems.map(async (problem) => {
          const perUser = await Promise.all(
            USERS.map(async (user) => {
              const summary = await cachedBlob(
                `submissions:${problem.id}:${user.name}`,
                TTL_MS,
                () => fetchSubmissionSummary(problem.id, user.name, sessionCookie),
                { force },
              )
              return [user.name, summary] as const
            }),
          )
          result[String(problem.id)] = Object.fromEntries(perUser)
        }),
      )
      return result
    },
    { force, event },
  )
})
