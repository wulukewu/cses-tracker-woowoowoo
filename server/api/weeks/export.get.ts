import { listWeeks, listNotes } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const weeks = await listWeeks()
  const rawNotes = await listNotes()

  // 深度過濾：移除所有空的或僅含空白的個人筆記，若整題為空則不保留該題
  const notes: Record<string, Record<string, string>> = {}
  for (const [problemId, contentMap] of Object.entries(rawNotes)) {
    if (contentMap && typeof contentMap === 'object') {
      const cleanMap: Record<string, string> = {}
      for (const [username, content] of Object.entries(contentMap)) {
        if (content && content.trim() !== '') {
          cleanMap[username] = content
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
