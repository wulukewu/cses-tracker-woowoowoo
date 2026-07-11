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
