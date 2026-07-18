import { saveWeek, deleteAllWeeks, saveNote, deleteAllNotes } from '~~/server/utils/blobs'
import type { Week } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const mode = query.mode
  const body = await readBody<any>(event)

  let weeks: any[] = []
  let notes: Record<string, any> = {}
  let isNewFormat = false

  if (body && !Array.isArray(body) && Array.isArray(body.weeks)) {
    weeks = body.weeks
    notes = body.notes || {}
    isNewFormat = true
  } else if (Array.isArray(body)) {
    weeks = body
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: expected an array of weeks or an object with weeks and notes',
    })
  }

  // 驗證結構是否符合 Week 介面
  for (const item of weeks) {
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

  // 驗證 notes 結構
  if (notes && typeof notes !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid notes structure in import payload',
    })
  }

  if (mode === 'overwrite') {
    await deleteAllWeeks()
    if (isNewFormat) {
      await deleteAllNotes()
    }
  }

  for (const week of weeks) {
    await saveWeek(week as Week)
  }

  if (isNewFormat && notes) {
    for (const [problemId, val] of Object.entries(notes)) {
      if (val && typeof val === 'object') {
        for (const [username, noteVal] of Object.entries(val)) {
          if (typeof noteVal === 'string') {
            await saveNote(problemId, username, noteVal, false)
          } else if (noteVal && typeof noteVal === 'object') {
            const content = (noteVal as any).content ?? ''
            const stuck = Boolean((noteVal as any).stuck)
            await saveNote(problemId, username, content, stuck)
          }
        }
      } else if (typeof val === 'string') {
        // 向後相容舊格式：若為純字串，預設歸屬為 'lukewu'
        await saveNote(problemId, 'lukewu', val, false)
      }
    }
  }

  return {
    success: true,
    importedCount: weeks.length,
    importedNotesCount: isNewFormat ? Object.keys(notes).length : 0,
  }
})
