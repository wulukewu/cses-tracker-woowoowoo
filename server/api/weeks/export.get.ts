import { listWeeks } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const weeks = await listWeeks()
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'content-disposition', 'attachment; filename="cses-tracker-weeks.json"')
  return weeks
})
