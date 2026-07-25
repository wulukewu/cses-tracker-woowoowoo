import { USERS } from '../../shared/users'
import type { ProblemStatsResponse, SubmissionsResponse, UserProgress, Week } from '../../shared/types'
import { fetchProblemStats, fetchSolvedTaskIds, fetchSubmissionSummary, CsesSessionExpiredError } from './cses'
import { cachedBlob } from './blobCache'
import { mapWithConcurrency } from './concurrency'

/**
 * Shared loaders behind both the API endpoints and the scheduled warmers, so the
 * cache keys and TTLs have exactly one definition. The warmers pass
 * `force: true` to re-scrape; the endpoints pass the caller's own flag and read
 * whatever the warmers last stored.
 *
 * Each TTL is deliberately at least twice its warm interval (see the
 * netlify/functions/warm-*.mts schedules). While a warmer is running on time an
 * entry is refreshed long before it can expire, so an expired read means the
 * schedule has stopped — which is precisely when the synchronous refresh in
 * blobCache should step in and heal it.
 *
 * These modules avoid Nitro auto-imports and `~~/*` value aliases so a plain
 * Netlify function can import them directly, without going back through the
 * site over HTTP.
 */
export const PROGRESS_TTL_MS = 10 * 60 * 1000
export const SUBMISSIONS_TTL_MS = 6 * 60 * 60 * 1000
export const PROBLEM_STATS_TTL_MS = 24 * 60 * 60 * 1000

/** Ceiling on sockets opened to cses.fi at once. See mapWithConcurrency. */
const SCRAPE_CONCURRENCY = 8

type LoadOptions = { force?: boolean; event?: any }

export async function loadProgress(
  sessionCookie: string,
  options: LoadOptions = {},
): Promise<{ users: UserProgress[]; expired: boolean }> {
  let expired = false

  const users = await mapWithConcurrency(USERS, SCRAPE_CONCURRENCY, async (user) => {
    try {
      const solvedIds = await cachedBlob(
        `solved:${user.csesId}`,
        PROGRESS_TTL_MS,
        () => fetchSolvedTaskIds(user.csesId, sessionCookie),
        options,
      )
      return { name: user.name, csesId: user.csesId, solvedIds }
    } catch (err) {
      if (err instanceof CsesSessionExpiredError) {
        expired = true
        return { name: user.name, csesId: user.csesId, solvedIds: [] }
      }
      throw err
    }
  })

  return { users, expired }
}

export async function loadSubmissions(
  week: Week,
  sessionCookie: string,
  options: LoadOptions = {},
): Promise<SubmissionsResponse> {
  const pairs = week.problems.flatMap((problem) => USERS.map((user) => ({ problem, user })))

  const entries = await mapWithConcurrency(pairs, SCRAPE_CONCURRENCY, async ({ problem, user }) => {
    const summary = await cachedBlob(
      `submissions:v2:${problem.id}:${user.name}`,
      SUBMISSIONS_TTL_MS,
      () => fetchSubmissionSummary(problem.id, user.name, sessionCookie),
      options,
    )
    return { problemId: String(problem.id), userName: user.name, summary }
  })

  const result: SubmissionsResponse = {}
  for (const { problemId, userName, summary } of entries) {
    result[problemId] ??= {}
    result[problemId]![userName] = summary
  }
  return result
}

export async function loadProblemStats(
  week: Week,
  sessionCookie: string,
  options: LoadOptions = {},
): Promise<ProblemStatsResponse> {
  const result: ProblemStatsResponse = {}

  await mapWithConcurrency(week.problems, SCRAPE_CONCURRENCY, async (problem) => {
    try {
      const stats = await cachedBlob(
        `problem-stats:${problem.id}`,
        PROBLEM_STATS_TTL_MS,
        () => fetchProblemStats(problem.id, sessionCookie),
        options,
      )
      if (stats) result[String(problem.id)] = stats
    } catch (err) {
      // Leave this problem out of the response rather than failing the whole
      // request, and leave nothing cached so the next caller retries instead of
      // showing a blank until the TTL lapses a day later.
      console.error(`[problem-stats] failed to load stats for task ${problem.id}:`, err)
    }
  })

  return result
}
