import { deleteAllWeeks } from '~~/server/utils/blobs'

export default defineEventHandler(async () => {
  await deleteAllWeeks()
  return { ok: true }
})
