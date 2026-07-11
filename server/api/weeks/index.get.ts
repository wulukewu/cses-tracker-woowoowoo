import { listWeeks } from '~~/server/utils/blobs'

export default defineEventHandler(async () => {
  return await listWeeks()
})
