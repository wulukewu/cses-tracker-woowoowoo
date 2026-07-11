import { getWeek, saveWeek } from '~~/server/utils/blobs'
import type { WeekProblem } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const existing = await getWeek(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'week not found' })
  }

  const body = await readBody<{ problems: WeekProblem[]; deadline: string | null }>(event)
  if (!body || !Array.isArray(body.problems) || body.problems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'problems is required' })
  }

  const updated = {
    ...existing,
    problems: body.problems,
    deadline: body.deadline ?? null,
  }

  await saveWeek(updated)
  return updated
})
