import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USERS } from '../../shared/users'

const cachedBlob = vi.fn()
const fetchSubmissionSummary = vi.fn()
const fetchProblemStats = vi.fn()
const fetchSolvedTaskIds = vi.fn()

class FakeSessionExpired extends Error {}

// Pass-through cache so these tests exercise the assembly and key naming rather
// than the caching, which blobCache.test.ts covers on its own.
vi.mock('./blobCache', () => ({
  cachedBlob: (key: string, ttl: number, fn: () => Promise<any>, options?: any) =>
    cachedBlob(key, ttl, fn, options) ?? fn(),
}))
vi.mock('./cses', () => ({
  fetchSubmissionSummary: (...a: any[]) => fetchSubmissionSummary(...a),
  fetchProblemStats: (...a: any[]) => fetchProblemStats(...a),
  fetchSolvedTaskIds: (...a: any[]) => fetchSolvedTaskIds(...a),
  CsesSessionExpiredError: FakeSessionExpired,
}))

const { loadSubmissions, loadProblemStats, loadProgress, SUBMISSIONS_TTL_MS } = await import('./refresh')

const WEEK = { id: 'wk1', createdAt: '', deadline: null, problems: [{ id: 101 }, { id: 202 }] } as any

beforeEach(() => {
  vi.clearAllMocks()
  cachedBlob.mockReturnValue(undefined)
  fetchSubmissionSummary.mockImplementation(async (taskId: number, user: string) => ({
    unlocked: true,
    waCount: 0,
    firstAcTime: null,
    submissions: [{ marker: `${taskId}-${user}` }],
  }))
  fetchProblemStats.mockResolvedValue({ solvedBy: 1, attemptedBy: 2, successRate: 50 })
  fetchSolvedTaskIds.mockResolvedValue([1, 2])
})

describe('loadSubmissions', () => {
  it('nests every user under their problem id, the shape the table reads', async () => {
    const result = await loadSubmissions(WEEK, 'cookie')

    expect(Object.keys(result).sort()).toEqual(['101', '202'])
    for (const problemId of ['101', '202']) {
      expect(Object.keys(result[problemId]!).sort()).toEqual(USERS.map((u) => u.name).sort())
    }
  })

  it('pairs each summary with the right problem and user', async () => {
    const result = await loadSubmissions(WEEK, 'cookie')

    expect(result['101']!['lukewu']!.submissions[0]).toEqual({ marker: '101-lukewu' })
    expect(result['202']!['yc']!.submissions[0]).toEqual({ marker: '202-yc' })
  })

  it('keys the cache per problem and user so one stale entry cannot mask another', async () => {
    await loadSubmissions(WEEK, 'cookie')

    const keys = cachedBlob.mock.calls.map((c) => c[0])
    expect(keys).toContain('submissions:v2:101:lukewu')
    expect(keys).toContain('submissions:v2:202:zyo')
    expect(keys).toHaveLength(WEEK.problems.length * USERS.length)
    expect(cachedBlob.mock.calls[0]![1]).toBe(SUBMISSIONS_TTL_MS)
  })

  it('passes force through, which is what makes a warm run actually re-scrape', async () => {
    await loadSubmissions(WEEK, 'cookie', { force: true })

    for (const call of cachedBlob.mock.calls) {
      expect(call[3]).toEqual({ force: true })
    }
  })
})

describe('loadProblemStats', () => {
  it('omits a problem whose scrape throws instead of failing the whole response', async () => {
    fetchProblemStats.mockImplementation(async (taskId: number) => {
      if (taskId === 101) throw new Error('cses 500')
      return { solvedBy: 3, attemptedBy: 4, successRate: 75 }
    })

    const result = await loadProblemStats(WEEK, 'cookie')

    expect(result['101']).toBeUndefined()
    expect(result['202']).toEqual({ solvedBy: 3, attemptedBy: 4, successRate: 75 })
  })

  it('omits a problem with no usable numbers without treating it as an error', async () => {
    fetchProblemStats.mockResolvedValue(null)

    const result = await loadProblemStats(WEEK, 'cookie')

    expect(result).toEqual({})
  })
})

describe('loadProgress', () => {
  it('returns one entry per tracked user', async () => {
    const { users, expired } = await loadProgress('cookie')

    expect(users.map((u) => u.name)).toEqual(USERS.map((u) => u.name))
    expect(expired).toBe(false)
  })

  it('flags an expired session and empties that user rather than throwing', async () => {
    fetchSolvedTaskIds.mockRejectedValue(new FakeSessionExpired())

    const { users, expired } = await loadProgress('cookie')

    expect(expired).toBe(true)
    expect(users.every((u) => u.solvedIds.length === 0)).toBe(true)
  })
})
