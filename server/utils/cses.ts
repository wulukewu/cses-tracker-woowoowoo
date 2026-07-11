import * as cheerio from 'cheerio'

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
