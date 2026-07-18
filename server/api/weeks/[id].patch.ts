import { getWeek, saveWeek } from '~~/server/utils/blobs'
import type { WeekProblem, WeekTodo } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const existing = await getWeek(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'week not found' })
  }

  const body = await readBody<{
    problems?: WeekProblem[]
    deadline?: string | null
    todos?: WeekTodo[]
  }>(event)

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'body is required' })
  }

  if (body.problems !== undefined && (!Array.isArray(body.problems) || body.problems.length === 0)) {
    throw createError({ statusCode: 400, statusMessage: 'problems is required' })
  }

  let cleanedTodos: WeekTodo[] | undefined = undefined
  if (body.todos !== undefined) {
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

  const updated = {
    ...existing,
    problems: body.problems !== undefined ? body.problems : existing.problems,
    deadline: body.deadline !== undefined ? body.deadline : existing.deadline,
    todos: body.todos !== undefined ? cleanedTodos : existing.todos,
  }

  // 移除 undefined 欄位，維持資料乾淨
  if (updated.todos === undefined) {
    delete updated.todos
  }

  await saveWeek(updated)
  return updated
})
