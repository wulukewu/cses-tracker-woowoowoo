import { listNotes } from '~~/server/utils/blobs'

export default defineEventHandler(async () => {
  return await listNotes()
})
