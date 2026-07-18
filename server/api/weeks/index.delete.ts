import { deleteAllWeeks, deleteAllNotes } from '~~/server/utils/blobs'

export default defineEventHandler(async () => {
  await deleteAllWeeks()
  await deleteAllNotes()
  return { ok: true }
})
