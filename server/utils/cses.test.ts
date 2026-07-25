import { afterEach, describe, expect, it, vi } from 'vitest'
import { CsesSessionExpiredError, fetchProblemStats, fetchSolvedTaskIds, fetchSubmissionSummary } from './cses'

function mockFetchOnce(html: string, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      text: () => Promise.resolve(html),
    }),
  )
}

function mockFetchSequence(responses: Array<{ html: string; status?: number }>) {
  const fns = responses.map((r) =>
    vi.fn().mockResolvedValue({
      status: r.status ?? 200,
      ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
      text: () => Promise.resolve(r.html),
    }),
  )
  let callIndex = 0
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      const fn = fns[Math.min(callIndex++, fns.length - 1)]
      return fn()
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchSolvedTaskIds', () => {
  it('returns the ids of tasks marked full, ignoring unsolved ones', async () => {
    mockFetchOnce(`
      <html><body>
        <a class="task-score full" href="/problemset/task/1234/">100</a>
        <a class="task-score" href="/problemset/task/5678/">0</a>
        <a class="task-score full" href="/problemset/task/999/">100</a>
      </body></html>
    `)

    const ids = await fetchSolvedTaskIds('user1', 'PHPSESSID=abc')

    expect(ids).toEqual([1234, 999])
  })

  it('throws CsesSessionExpiredError when no task-score elements are found', async () => {
    mockFetchOnce('<html><body>Please login to continue</body></html>')

    await expect(fetchSolvedTaskIds('user1', 'PHPSESSID=abc')).rejects.toBeInstanceOf(CsesSessionExpiredError)
  })

  it('sends the session cookie as the cookie header', async () => {
    mockFetchOnce('<html><body><a class="task-score full" href="/problemset/task/1/"></a></body></html>')

    await fetchSolvedTaskIds('user1', 'PHPSESSID=abc')

    expect(fetch).toHaveBeenCalledWith(
      'https://cses.fi/problemset/user/user1/',
      expect.objectContaining({ headers: expect.objectContaining({ cookie: 'PHPSESSID=abc' }) }),
    )
  })
})

describe('fetchSubmissionSummary', () => {
  it('returns unlocked: false on a 404', async () => {
    mockFetchOnce('not found', 404)

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary).toEqual({ unlocked: false, waCount: 0, firstAcTime: null, submissions: [] })
  })

  function row(time: string, verdictClass: string, detailHref?: string) {
    const detailLink = detailHref ? `<a class="details-link" href="${detailHref}">details</a>` : ''
    return `
      <tr>
        <td>${time}</td>
        <td>alice</td>
        <td>C++</td>
        <td>0.01 s</td>
        <td>1024 B</td>
        <td class="${verdictClass}">${detailLink}</td>
      </tr>
    `
  }

  it('counts WA submissions before the first AC and stops there, chronologically', async () => {
    // newest first in the DOM, as CSES renders it
    mockFetchOnce(`
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-03 10:00:00', 'full', '/problemset/result/1/2')}
        ${row('2024-01-02 10:00:00', 'zero')}
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `)

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.unlocked).toBe(true)
    expect(summary.waCount).toBe(2)
    expect(summary.firstAcTime).toBe('2024-01-03 10:00:00')
    expect(summary.submissions.map((s) => s.verdict)).toEqual(['FAIL', 'FAIL', 'AC'])
    expect(summary.submissions.at(-1)?.detailUrl).toBe('https://cses.fi/problemset/result/1/2')
  })

  it('never solved: reports every failing submission with no firstAcTime', async () => {
    mockFetchSequence([
      {
        html: `
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-02 10:00:00', 'zero')}
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `,
      },
      { html: '<table class="full-width"><tr><th>Time</th></tr></table>' },
    ])

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.waCount).toBe(2)
    expect(summary.firstAcTime).toBeNull()
    expect(summary.submissions).toHaveLength(2)
  })

  it('does not duplicate rows when CSES clamps out-of-range pages to the same content', async () => {
    // mockFetchOnce re-serves the same page for every fetch — exactly how CSES
    // treats an out-of-range page number (re-serving an existing page, not 404).
    // An unsolved problem has no AC to break on, so the loop must instead detect
    // the repeated page and stop, rather than appending the row once per page.
    mockFetchOnce(`
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `)

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.waCount).toBe(1)
    expect(summary.submissions).toHaveLength(1)
    expect(summary.submissions.map((s) => s.verdict)).toEqual(['FAIL'])
  })

  it('captures every WA across multiple genuinely different pages before clamping', async () => {
    // Two real pages of distinct WA rows, then CSES clamps: the sequence is
    // exhausted so the mock re-serves the last (page 2) again. All four rows must
    // be captured and none dropped — guarding against stopping too early.
    mockFetchSequence([
      {
        html: `
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-04 10:00:00', 'zero')}
        ${row('2024-01-03 10:00:00', 'zero')}
      </table>
    `,
      },
      {
        html: `
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-02 10:00:00', 'zero')}
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `,
      },
    ])

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.waCount).toBe(4)
    expect(summary.submissions).toHaveLength(4)
    expect(summary.submissions.map((s) => s.time)).toEqual([
      '2024-01-01 10:00:00',
      '2024-01-02 10:00:00',
      '2024-01-03 10:00:00',
      '2024-01-04 10:00:00',
    ])
  })

  it('skips CE (compile error) rows entirely — not counted as WA and not in submissions', async () => {
    mockFetchOnce(`
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-03 10:00:00', 'full', '/problemset/result/1/2')}
        ${row('2024-01-02 10:00:00', 'skipped')}
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `)

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.waCount).toBe(1)
    expect(summary.submissions.map((s) => s.verdict)).toEqual(['FAIL', 'AC'])
  })

  it('includes every AC row and sets detailUrl on each of them', async () => {
    mockFetchOnce(`
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-05 10:00:00', 'full', '/problemset/result/3/4')}
        ${row('2024-01-04 10:00:00', 'zero')}
        ${row('2024-01-03 10:00:00', 'full', '/problemset/result/1/2')}
        ${row('2024-01-02 10:00:00', 'zero')}
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `)

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.waCount).toBe(2)
    expect(summary.firstAcTime).toBe('2024-01-03 10:00:00')
    expect(summary.submissions.map((s) => s.verdict)).toEqual(['FAIL', 'FAIL', 'AC', 'FAIL', 'AC'])
    expect(summary.submissions[2].detailUrl).toBe('https://cses.fi/problemset/result/1/2')
    expect(summary.submissions[4].detailUrl).toBe('https://cses.fi/problemset/result/3/4')
  })

  it('non-AC rows never carry a detailUrl even if a details-link happens to be present', async () => {
    mockFetchSequence([
      {
        html: `
      <table class="full-width">
        <tr><th>Time</th></tr>
        ${row('2024-01-01 10:00:00', 'zero')}
      </table>
    `,
      },
      { html: '<table class="full-width"><tr><th>Time</th></tr></table>' },
    ])

    const summary = await fetchSubmissionSummary(1234, 'alice', 'PHPSESSID=abc')

    expect(summary.submissions[0].detailUrl).toBeUndefined()
  })
})

describe('fetchProblemStats', () => {
  function statsTable(solvedBy: string, attemptedBy: string) {
    return `
      <table class="summary-table">
        <tr><td>Solved by:</td><td>${solvedBy}</td></tr>
        <tr><td>Attempted by:</td><td>${attemptedBy}</td></tr>
      </table>
    `
  }

  it('parses solved/attempted counts and computes a rounded success rate', async () => {
    mockFetchOnce(statsTable('1,234', '2,000'))

    const stats = await fetchProblemStats(1234, 'PHPSESSID=abc')

    expect(stats).toEqual({ solvedBy: 1234, attemptedBy: 2000, successRate: 61.7 })
  })

  it('returns null when attemptedBy is 0 to avoid a divide-by-zero success rate', async () => {
    mockFetchOnce(statsTable('0', '0'))

    const stats = await fetchProblemStats(1234, 'PHPSESSID=abc')

    expect(stats).toBeNull()
  })

  it('throws when the response is not ok, so a transient failure is not cached as null', async () => {
    mockFetchOnce('', 500)

    await expect(fetchProblemStats(1234, 'PHPSESSID=abc')).rejects.toThrow('returned 500')
  })

  it('returns null when the expected table rows are missing', async () => {
    mockFetchOnce('<html><body>nothing here</body></html>')

    const stats = await fetchProblemStats(1234, 'PHPSESSID=abc')

    expect(stats).toBeNull()
  })
})
