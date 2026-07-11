import * as cheerio from 'cheerio'
import type { ProblemStats, SubmissionEntry, SubmissionSummary } from '~~/shared/types'

export class CsesSessionExpiredError extends Error {
  constructor() {
    super('CSES session expired or invalid')
    this.name = 'CsesSessionExpiredError'
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

  const res = await fetch(`https://cses.fi/problemset/user/${csesId}/`, {
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
 * Only page 1 is fetched (newest submissions first); a user with more than
 * ~50 submissions on one task could have an older first-AC missed.
 */
export async function fetchSubmissionSummary(
  taskId: number,
  username: string,
  sessionCookie: string,
): Promise<SubmissionSummary> {
  const res = await fetch(
    `https://cses.fi/problemset/queue/${taskId}/1/?user=${encodeURIComponent(username)}`,
    {
      headers: {
        cookie: sessionCookie,
        'user-agent': 'Mozilla/5.0 (cses-tracker)',
      },
    },
  )

  if (res.status === 404) {
    return { unlocked: false, waCount: 0, firstAcTime: null, submissions: [] }
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const rows = $('table.full-width tr').filter((_, el) => $(el).find('th').length === 0)

  type ParsedRow = {
    time: string
    verdict: 'AC' | 'FAIL' | 'CE'
    lang: string
    execTime: string
    codeSize: string
    detailUrl: string | null
  }
  const newestFirst: ParsedRow[] = []
  rows.each((_, el) => {
    const tds = $(el).find('td')
    if (tds.length < 6) return
    const time = $(tds[0]).text().trim()
    // tds[1] is the CSES username link — already known (this fetch is filtered to one user).
    const lang = $(tds[2]).text().trim()
    const execTime = $(tds[3]).text().trim().replace(/\s+/g, ' ')
    const codeSize = $(tds[4]).text().trim().replace(/\s+/g, ' ')
    const classes = ($(tds[5]).attr('class') || '').split(/\s+/)
    const verdict: ParsedRow['verdict'] = classes.includes('full')
      ? 'AC'
      : classes.includes('skipped')
        ? 'CE'
        : 'FAIL'
    // Only AC rows carry a "details" link (to CSES's public hacking/results page for that entry).
    const detailHref = $(el).find('a.details-link').attr('href') || null
    const detailUrl = detailHref ? `https://cses.fi${detailHref}` : null
    newestFirst.push({ time, verdict, lang, execTime, codeSize, detailUrl })
  })

  const chronological = [...newestFirst].reverse()

  let waCount = 0
  let firstAcTime: string | null = null
  const submissions: SubmissionEntry[] = []
  for (const row of chronological) {
    if (row.verdict === 'CE') continue
    if (row.verdict === 'AC') {
      firstAcTime = row.time
      submissions.push({
        time: row.time,
        verdict: 'AC',
        lang: row.lang,
        execTime: row.execTime,
        codeSize: row.codeSize,
        detailUrl: row.detailUrl,
      })
      break
    }
    waCount++
    submissions.push({ time: row.time, verdict: 'FAIL', lang: row.lang, execTime: row.execTime, codeSize: row.codeSize })
  }

  return { unlocked: true, waCount, firstAcTime, submissions }
}

/**
 * Fetches CSES's site-wide "Statistics" page for a task — solved/attempted
 * counts across all CSES users, not just the tracked ones. Unlike the queue
 * page, this doesn't require the scraper account to have solved the task
 * itself.
 */
export async function fetchProblemStats(taskId: number, sessionCookie: string): Promise<ProblemStats | null> {
  const res = await fetch(`https://cses.fi/problemset/stats/${taskId}/`, {
    headers: {
      cookie: sessionCookie,
      'user-agent': 'Mozilla/5.0 (cses-tracker)',
    },
  })

  if (!res.ok) return null

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
