import { listWeeks, listNotes } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const weeks = await listWeeks()
  const rawNotes = await listNotes()

  // 深度過濾：移除所有空的或僅含空白的個人筆記且未卡題的項目，若整題為空則不保留該題
  const notes: Record<string, Record<string, any>> = {}
  for (const [problemId, contentMap] of Object.entries(rawNotes)) {
    if (contentMap && typeof contentMap === 'object') {
      const cleanMap: Record<string, any> = {}
      for (const [username, val] of Object.entries(contentMap)) {
        const content = val?.content ?? ''
        const stuck = Boolean(val?.stuck)
        if (content.trim() !== '' || stuck) {
          cleanMap[username] = { content, stuck }
        }
      }
      if (Object.keys(cleanMap).length > 0) {
        notes[problemId] = cleanMap
      }
    }
  }

  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="cses-tracker-data.json"')
  return {
    weeks,
    notes,
  }
})
