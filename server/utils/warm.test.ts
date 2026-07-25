import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const listWeeks = vi.fn()
const loadProgress = vi.fn()
const loadSubmissions = vi.fn()
const loadProblemStats = vi.fn()

vi.mock('./blobs', () => ({ listWeeks: (...a: any[]) => listWeeks(...a) }))
vi.mock('./refresh', () => ({
  loadProgress: (...a: any[]) => loadProgress(...a),
  loadSubmissions: (...a: any[]) => loadSubmissions(...a),
  loadProblemStats: (...a: any[]) => loadProblemStats(...a),
}))

const { warm } = await import('./warm')

const WEEK = { id: 'wk1', problems: [{ id: 1 }, { id: 2 }] }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CSES_SESSION_COOKIE = 'PHPSESSID=abc'
  listWeeks.mockResolvedValue([WEEK])
  loadProgress.mockResolvedValue({ users: [{}, {}, {}, {}], expired: false })
  loadSubmissions.mockResolvedValue({ '1': {}, '2': {} })
  loadProblemStats.mockResolvedValue({ '1': {}, '2': {} })
})

afterEach(() => {
  delete process.env.CSES_SESSION_COOKIE
})

describe('warm', () => {
  it('forces a re-scrape, since without it a warmer would read its own fresh entry and do nothing', async () => {
    await warm('submissions')

    expect(loadSubmissions).toHaveBeenCalledWith(WEEK, 'PHPSESSID=abc', { force: true })
  })

  it('forces a re-scrape for progress too', async () => {
    await warm('progress')

    expect(loadProgress).toHaveBeenCalledWith('PHPSESSID=abc', { force: true })
    expect(listWeeks).not.toHaveBeenCalled()
  })

  it('warms only the most recent week, not every week ever planned', async () => {
    const older = { id: 'wk0', problems: [{ id: 9 }] }
    listWeeks.mockResolvedValue([WEEK, older])

    await warm('problem-stats')

    expect(loadProblemStats).toHaveBeenCalledTimes(1)
    expect(loadProblemStats).toHaveBeenCalledWith(WEEK, 'PHPSESSID=abc', { force: true })
  })

  it('reports failure when the session cookie is missing, without scraping', async () => {
    delete process.env.CSES_SESSION_COOKIE

    const result = await warm('submissions')

    expect(result.ok).toBe(false)
    expect(result.message).toContain('CSES_SESSION_COOKIE')
    expect(loadSubmissions).not.toHaveBeenCalled()
  })

  it('reports failure when the CSES session has expired rather than claiming success', async () => {
    loadProgress.mockResolvedValue({ users: [], expired: true })

    const result = await warm('progress')

    expect(result.ok).toBe(false)
    expect(result.message).toContain('expired')
  })

  it('reports a thrown scrape as a failure instead of propagating it to the scheduler', async () => {
    loadSubmissions.mockRejectedValue(new Error('cses unreachable'))

    const result = await warm('submissions')

    expect(result.ok).toBe(false)
    expect(result.message).toContain('cses unreachable')
  })

  it('succeeds with nothing to do when no week has been planned yet', async () => {
    listWeeks.mockResolvedValue([])

    const result = await warm('submissions')

    expect(result.ok).toBe(true)
    expect(loadSubmissions).not.toHaveBeenCalled()
  })

  it('reports elapsed time, the number that has to stay inside the platform limit', async () => {
    const clock = vi.fn().mockReturnValueOnce(1_000).mockReturnValue(4_500)

    const result = await warm('submissions', clock)

    expect(result.elapsedMs).toBe(3_500)
  })
})
