import { saveWeek } from '~~/server/utils/blobs'
import { shortId } from '~~/server/utils/id'
import type { Week, WeekProblem } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ problems: WeekProblem[]; deadline: string | null }>(event)

  if (!body || !Array.isArray(body.problems) || body.problems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'problems is required' })
  }

  const week: Week = {
    id: shortId(),
    createdAt: new Date().toISOString(),
    deadline: body.deadline ?? null,
    problems: body.problems,
  }

  await saveWeek(week)
  return week
})
