import { saveWeek } from '~~/server/utils/blobs'
import { shortId } from '~~/server/utils/id'
import type { Week, WeekProblem, WeekTodo } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    problems: WeekProblem[]
    deadline: string | null
    todos?: WeekTodo[]
  }>(event)

  if (!body || !Array.isArray(body.problems) || body.problems.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'problems is required' })
  }

  let cleanedTodos: WeekTodo[] | undefined = undefined
  if (body.todos && Array.isArray(body.todos)) {
    cleanedTodos = body.todos
      .filter((t) => t.content && t.content.trim() !== '')
      .map((t) => ({
        id: t.id,
        content: t.content.trim(),
        completed: Boolean(t.completed),
        assignee: t.assignee ? t.assignee.trim() : undefined,
      }))
    if (cleanedTodos.length === 0) {
      cleanedTodos = undefined
    }
  }

  const week: Week = {
    id: shortId(),
    createdAt: new Date().toISOString(),
    deadline: body.deadline ?? null,
    problems: body.problems,
  }

  if (cleanedTodos !== undefined) {
    week.todos = cleanedTodos
  }

  await saveWeek(week)
  return week
})
