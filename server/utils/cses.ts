import * as cheerio from 'cheerio'
import type { ProblemStats, SubmissionEntry, SubmissionSummary } from '~~/shared/types'

const FETCH_TIMEOUT_MS = 15_000
const MAX_RETRIES = 1

export class CsesSessionExpiredError extends Error {
  constructor() {
    super('CSES session expired or invalid')
    this.name = 'CsesSessionExpiredError'
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Retries every failure, including the `TypeError` that `fetch` raises for a
 * dropped connection or DNS blip — the most retryable case there is, and one an
 * earlier revision excluded, leaving only timeouts to be retried. These are all
 * idempotent GETs, so a repeat attempt is always safe.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchWithTimeout(url, options)
    } catch (err) {
      if (attempt >= retries) throw err
      console.warn(`[cses] fetch failed (attempt ${attempt + 1}/${retries + 1}) for ${url.slice(0, 80)}:`, err)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

/**
 * Fetches a CSES user's problemset stats page and returns the ids of every
 * task marked as solved ("full"). Throws CsesSessionExpiredError when the
 * page comes back as a login page instead of the stats page.
 */
export async function fetchSolvedTaskIds(csesId: string, sessionCookie: string): Promise<number[]> {
  if (!sessionCookie) {
    console.error(`[cses] CSES_SESSION_COOKIE is empty when fetching user ${csesId}`)
  }

  const res = await fetchWithRetry(`https://cses.fi/problemset/user/${csesId}/`, {
    headers: {
      cookie: sessionCookie,
      'user-agent': 'Mozilla/5.0 (cses-tracker)',
    },
  })

  const html = await res.text()
  const $ = cheerio.load(html)

  const taskScoreEls = $('a.task-score')
  if (taskScoreEls.length === 0) {
    console.error(
      `[cses] no .task-score found for user ${csesId} — status=${res.status} bodyLength=${html.length} ` +
        `cookieLength=${sessionCookie.length} loginPrompt=${html.includes('Please login')} bodySnippet=${JSON.stringify(html.slice(0, 300))}`,
    )
    throw new CsesSessionExpiredError()
  }

  const solved: number[] = []
  taskScoreEls.each((_, el) => {
    const classes = ($(el).attr('class') || '').split(/\s+/)
    if (!classes.includes('full')) return
    const href = $(el).attr('href') || ''
    const match = href.match(/\/problemset\/task\/(\d+)/)
    if (match) solved.push(Number(match[1]))
  })

  return solved
}

/**
 * Fetches a user's submission history for a single task via CSES's queue page,
 * filtered to that user. CSES only renders this page once the *scraper's own*
 * account has solved the task itself (otherwise it 404s — reflected as
 * `unlocked: false`). The filter must be the CSES username, not the numeric
 * user id (the id silently matches zero rows).
 *
 * Pages through the submission history (up to MAX_PAGES) so a busy user
 * with many submissions per problem does not miss an older first AC.
 */
const SUBMISSION_MAX_PAGES = 10

export async function fetchSubmissionSummary(
  taskId: number,
  username: string,
  sessionCookie: string,
): Promise<SubmissionSummary> {
  type ParsedRow = {
    time: string
    verdict: 'AC' | 'FAIL' | 'CE'
    lang: string
    execTime: string
    codeSize: string
    detailUrl: string | null
  }
  const newestFirst: ParsedRow[] = []
  // CSES clamps out-of-range page numbers, re-serving an existing page instead of
  // 404-ing. Track a signature per row so a repeated page is recognised and the
  // loop stops, rather than appending the same rows once per page (up to
  // SUBMISSION_MAX_PAGES times). Distinct submissions always differ by timestamp,
  // so this never drops genuinely older rows.
  const seen = new Set<string>()
  let reachedCap = false

  for (let page = 1; page <= SUBMISSION_MAX_PAGES; page++) {
    const res = await fetchWithRetry(
      `https://cses.fi/problemset/queue/${taskId}/${page}/?user=${encodeURIComponent(username)}`,
      {
        headers: {
          cookie: sessionCookie,
          'user-agent': 'Mozilla/5.0 (cses-tracker)',
        },
      },
    )

    if (res.status === 404) {
      if (page === 1) return { unlocked: false, waCount: 0, firstAcTime: null, submissions: [] }
      break
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const rows = $('table.full-width tr').filter((_, el) => $(el).find('th').length === 0)
    if (rows.length === 0) break

    let foundAcOnPage = false
    let newOnPage = 0
    rows.each((_, el) => {
      const tds = $(el).find('td')
      if (tds.length < 6) return
      const time = $(tds[0]).text().trim()
      const lang = $(tds[2]).text().trim()
      const execTime = $(tds[3]).text().trim().replace(/\s+/g, ' ')
      const codeSize = $(tds[4]).text().trim().replace(/\s+/g, ' ')
      const classes = ($(tds[5]).attr('class') || '').split(/\s+/)
      const verdict: ParsedRow['verdict'] = classes.includes('full')
        ? 'AC'
        : classes.includes('skipped')
          ? 'CE'
          : 'FAIL'
      const sig = `${time}|${verdict}|${lang}|${execTime}|${codeSize}`
      if (seen.has(sig)) return
      seen.add(sig)
      newOnPage++
      const detailHref = $(el).find('a.details-link').attr('href') || null
      const detailUrl = detailHref ? `https://cses.fi${detailHref}` : null
      newestFirst.push({ time, verdict, lang, execTime, codeSize, detailUrl })
      if (verdict === 'AC') foundAcOnPage = true
    })

    // Whole page was already seen -> CSES clamped us past the last real page.
    if (newOnPage === 0) break
    if (foundAcOnPage) break
    if (page === SUBMISSION_MAX_PAGES) reachedCap = true
  }

  if (reachedCap) {
    console.warn(
      `[cses] submission history for task ${taskId} user ${username} hit page cap ` +
        `(${SUBMISSION_MAX_PAGES}) without an AC; older submissions may be truncated`,
    )
  }

  const chronological = [...newestFirst].reverse()

  let waCount = 0
  let firstAcTime: string | null = null
  let sawAc = false
  const submissions: SubmissionEntry[] = []
  for (const row of chronological) {
    if (row.verdict === 'CE') continue
    if (row.verdict === 'AC') {
      if (!firstAcTime) firstAcTime = row.time
      sawAc = true
      submissions.push({
        time: row.time,
        verdict: 'AC',
        lang: row.lang,
        execTime: row.execTime,
        codeSize: row.codeSize,
        detailUrl: row.detailUrl,
      })
    } else {
      if (!sawAc) waCount++
      submissions.push({ time: row.time, verdict: 'FAIL', lang: row.lang, execTime: row.execTime, codeSize: row.codeSize })
    }
  }

  return { unlocked: true, waCount, firstAcTime, submissions }
}

/**
 * Fetches CSES's site-wide "Statistics" page for a task — solved/attempted
 * counts across all CSES users, not just the tracked ones. Unlike the queue
 * page, this doesn't require the scraper account to have solved the task
 * itself.
 *
 * Throws on a non-ok response so a transient CSES failure propagates instead of
 * being cached: `null` is a value the caller stores for a full day, and a hiccup
 * must not blank a problem's stats until tomorrow. `null` is reserved for a page
 * that genuinely carries no usable numbers.
 */
export async function fetchProblemStats(taskId: number, sessionCookie: string): Promise<ProblemStats | null> {
  const res = await fetchWithRetry(`https://cses.fi/problemset/stats/${taskId}/`, {
    headers: {
      cookie: sessionCookie,
      'user-agent': 'Mozilla/5.0 (cses-tracker)',
    },
  })

  if (!res.ok) {
    throw new Error(`[cses] stats page for task ${taskId} returned ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  let solvedBy: number | null = null
  let attemptedBy: number | null = null
  $('table.summary-table tr').each((_, el) => {
    const tds = $(el).find('td')
    if (tds.length < 2) return
    const label = $(tds[0]).text().trim()
    const value = $(tds[1]).text().trim().replace(/,/g, '')
    if (label === 'Solved by:') solvedBy = Number(value)
    else if (label === 'Attempted by:') attemptedBy = Number(value)
  })

  if (solvedBy === null || attemptedBy === null || attemptedBy === 0) return null

  return {
    solvedBy,
    attemptedBy,
    successRate: Math.round((solvedBy / attemptedBy) * 1000) / 10,
  }
}
