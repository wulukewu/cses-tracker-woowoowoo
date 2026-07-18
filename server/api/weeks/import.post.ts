import { saveWeek, deleteAllWeeks } from '~~/server/utils/blobs'
import type { Week } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const mode = query.mode
  const body = await readBody<any>(event)

  if (!Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: expected an array of weeks',
    })
  }

  // 驗證結構是否符合 Week 介面
  for (const item of body) {
    if (!item.id || !item.createdAt || !Array.isArray(item.problems)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid week structure in import payload: ${JSON.stringify(item)}`,
      })
    }
    for (const prob of item.problems) {
      if (typeof prob.id !== 'number' || typeof prob.name !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid problem structure inside week: ${JSON.stringify(prob)}`,
        })
      }
    }
  }

  if (mode === 'overwrite') {
    await deleteAllWeeks()
  }

  for (const week of body) {
    await saveWeek(week as Week)
  }

  return {
    success: true,
    importedCount: body.length,
  }
})
