import problems from '~~/server/data/problems.json'
import type { ProblemCategory } from '~~/shared/types'

export default defineEventHandler((): ProblemCategory[] => {
  return problems as ProblemCategory[]
})
