import { saveNote } from '~~/server/utils/blobs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }
  const body = await readBody<{ username: string; content?: string; stuck?: boolean }>(event)
  const username = body?.username
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'username is required' })
  }
  const content = body?.content ?? ''
  const stuck = Boolean(body?.stuck)
  await saveNote(id, username, content, stuck)
  return { success: true }
})
