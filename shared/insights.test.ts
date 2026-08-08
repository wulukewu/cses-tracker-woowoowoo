import { describe, expect, it } from 'vitest'
import { computeProblemInsights } from './insights'
import type { SubmissionSummary, SubmissionsResponse } from './types'

function summary(overrides: Partial<SubmissionSummary> = {}, submissions: SubmissionSummary['submissions'] = []): SubmissionSummary {
  return {
    unlocked: true,
    waCount: 0,
    firstAcTime: null,
    submissions,
    ...overrides,
  }
}

function ac(time: string, execTime: string) {
  return { time, verdict: 'AC' as const, lang: 'C++', execTime, codeSize: '100 B' }
}

function fail(time: string) {
  return { time, verdict: 'FAIL' as const, lang: 'C++', execTime: '0.10 s', codeSize: '100 B' }
}

const USERS = [{ name: 'alice' }, { name: 'bob' }, { name: 'carol' }]

function build(entries: Record<string, SubmissionSummary>): SubmissionsResponse {
  return { '1': entries }
}

describe('computeProblemInsights', () => {
  it('yields first-solver to the earliest AC and best-fastest to the min execTime overall', () => {
    const { firstSolverNames, fastestNames } = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.09 s')]),
        bob: summary({ firstAcTime: '2026-07-21 10:00:00' }, [ac('2026-07-21 10:00:00', '0.03 s')]),
        carol: summary({ firstAcTime: '2026-07-19 10:00:00' }, [ac('2026-07-19 10:00:00', '0.05 s')]),
      }),
    )
    expect(firstSolverNames).toEqual(['carol'])
    expect(fastestNames).toEqual(['bob'])
  })

  it('treats same-sec first AC as a tie for the gold dot', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.05 s')]),
        bob: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.03 s')]),
        carol: summary({ firstAcTime: '2026-07-21 10:00:00' }, [ac('2026-07-21 10:00:00', '0.02 s')]),
      }),
    )
    expect(insight.firstSolverNames).toEqual(['alice', 'bob'])
    expect(insight.fastestNames).toEqual(['carol'])
  })

  it('takes the best AC across all submissions, not just the first AC', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.09 s')]),
        bob: summary({ firstAcTime: '2026-07-20 10:00:00' }, [
          ac('2026-07-20 10:00:00', '0.09 s'),
          ac('2026-07-21 10:00:00', '0.02 s'),
        ]),
        carol: summary({ firstAcTime: null }, [fail('2026-07-19 10:00:00')]),
      }),
    )
    expect(insight.fastestNames).toEqual(['bob'])
    expect(insight.firstSolverNames).toEqual(['alice', 'bob'])
  })

  it('ties on an identical two-decimal execTime promote every tied solver', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.00 s')]),
        bob: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.00 s')]),
        carol: summary({ firstAcTime: '2026-07-21 10:00:00' }, [ac('2026-07-21 10:00:00', '0.05 s')]),
      }),
    )
    expect(insight.fastestNames).toEqual(['alice', 'bob'])
  })

  it('still credits a solo solver (see 4dae7b5)', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.03 s')]),
      }),
    )
    expect(insight.firstSolverNames).toEqual(['alice'])
    expect(insight.fastestNames).toEqual(['alice'])
  })

  it('excludes locked (unlocked:false) users entirely', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        bob: summary({ unlocked: false, firstAcTime: '2026-07-19 10:00:00' }, [ac('2026-07-19 10:00:00', '0.02 s')]),
        carol: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '0.04 s')]),
      }),
    )
    expect(insight.firstSolverNames).toEqual(['carol'])
    expect(insight.fastestNames).toEqual(['carol'])
  })

  it('does not let an unparseable execTime ("< 0.01 s") poison the slowest', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, [ac('2026-07-20 10:00:00', '< 0.01 s')]),
        bob: summary({ firstAcTime: '2026-07-21 10:00:00' }, [ac('2026-07-21 10:00:00', '0.04 s')]),
      }),
    )
    expect(insight.fastestNames).toEqual(['bob'])
  })

  it('handles the case where nobody has a parseable execTime', () => {
    const insight = computeProblemInsights(
      '1',
      USERS,
      build({
        alice: summary({ firstAcTime: '2026-07-20 10:00:00' }, []),
        bob: summary({ firstAcTime: '2026-07-21 10:00:00' }, [ac('2026-07-21 10:00:00', '< 0.01 s')]),
      }),
    )
    expect(insight.fastestNames).toEqual([])
    expect(insight.firstSolverNames).toEqual(['alice'])
  })
})