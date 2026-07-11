import { getWeek, deleteWeek } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const existing = await getWeek(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'week not found' })
  }

  await deleteWeek(id)
  return { ok: true }
})
