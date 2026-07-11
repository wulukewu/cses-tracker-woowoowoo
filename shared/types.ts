export interface WeekProblem {
  id: number
  name: string
}

export interface Week {
  id: string
  createdAt: string
  deadline: string | null
  problems: WeekProblem[]
}

export interface ProblemCategory {
  name: string
  problems: WeekProblem[]
}

export interface UserProgress {
  name: string
  csesId: string
  solvedIds: number[]
}

export interface ProgressResponse {
  week: Week | null
  users: UserProgress[]
  staleSince: string | null
}

export interface SubmissionEntry {
  time: string
  verdict: 'AC' | 'FAIL'
}

export interface SubmissionSummary {
  /** false when the scraper's CSES account hasn't solved this task itself yet — CSES gates the queue page on that. */
  unlocked: boolean
  /** failed submissions (WA/RE/TLE/...) before the first AC; CE is never counted. */
  waCount: number
  firstAcTime: string | null
  /** chronological submissions up to and including the first AC; empty/partial when never solved. */
  submissions: SubmissionEntry[]
}

/** `submissions[problemId][username]` */
export type SubmissionsResponse = Record<string, Record<string, SubmissionSummary>>
