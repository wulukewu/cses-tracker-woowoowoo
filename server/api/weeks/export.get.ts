import { listWeeks, listNotes } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const weeks = await listWeeks()
  const notes = await listNotes()
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="cses-tracker-data.json"')
  return {
    weeks,
    notes,
  }
})
