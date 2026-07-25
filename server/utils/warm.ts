import { listWeeks } from './blobs'
import { loadProgress, loadProblemStats, loadSubmissions } from './refresh'

export type WarmTarget = 'progress' | 'submissions' | 'problem-stats'

export interface WarmResult {
  ok: boolean
  message: string
  elapsedMs: number
}

/**
 * Re-scrapes one slice of CSES data and stores it, so ordinary visitors are
 * always served from cache and never wait on cses.fi themselves.
 *
 * Lives here rather than in netlify/functions so the scheduled wrappers stay
 * declarations, and so this is reachable from tests. The wrappers call it
 * directly instead of requesting the site's own API: a self-request would put
 * the scraping inside the page function's time budget as well as the scheduled
 * one, leaving two limits to satisfy instead of one.
 *
 * `force` is what makes warming work at all — without it a warmer would read
 * its own still-fresh entry and scrape nothing.
 */
export async function warm(target: WarmTarget, now = Date.now): Promise<WarmResult> {
  const startedAt = now()
  const elapsed = () => now() - startedAt

  const sessionCookie = process.env.CSES_SESSION_COOKIE || ''
  if (!sessionCookie) {
    return { ok: false, message: 'CSES_SESSION_COOKIE is not set', elapsedMs: elapsed() }
  }

  try {
    if (target === 'progress') {
      const { users, expired } = await loadProgress(sessionCookie, { force: true })
      return expired
        ? { ok: false, message: 'CSES session expired; scraped nothing', elapsedMs: elapsed() }
        : { ok: true, message: `${users.length} users`, elapsedMs: elapsed() }
    }

    // Only the current week is ever on screen, so only its problems are worth
    // scraping; older weeks keep whatever was last stored for them.
    const week = (await listWeeks())[0] ?? null
    if (!week) {
      return { ok: true, message: 'no weeks yet; nothing to warm', elapsedMs: elapsed() }
    }

    const warmed =
      target === 'submissions'
        ? await loadSubmissions(week, sessionCookie, { force: true })
        : await loadProblemStats(week, sessionCookie, { force: true })

    return {
      ok: true,
      message: `week ${week.id}, ${Object.keys(warmed).length} problems`,
      elapsedMs: elapsed(),
    }
  } catch (err) {
    return { ok: false, message: `failed: ${(err as Error)?.message ?? err}`, elapsedMs: elapsed() }
  }
}

/** Runs a warm target and reports it as an HTTP response for the scheduler. */
export async function runWarmHandler(target: WarmTarget): Promise<Response> {
  const result = await warm(target)

  // The elapsed time is the number to watch in the function logs: it has to
  // stay comfortably inside the platform's limit for scheduled functions, and
  // it grows with the week's problem count.
  const line = `[warm:${target}] ${result.message} in ${result.elapsedMs}ms`
  if (result.ok) console.log(line)
  else console.error(line)

  return new Response(result.message, { status: result.ok ? 200 : 500 })
}
