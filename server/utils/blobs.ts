import { getStore } from './netlifyBlobs'
import type { Week, UserNote } from '~~/shared/types'

function weeksStore() {
  return getStore('weeks')
}

function metaStore() {
  return getStore('meta')
}

export async function listWeeks(): Promise<Week[]> {
  const store = weeksStore()
  const { blobs } = await store.list()
  const weeks = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<Week>),
  )
  return weeks
    .filter((w): w is Week => Boolean(w))
    .sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? ''))
}

export async function getWeek(id: string): Promise<Week | null> {
  const store = weeksStore()
  return (await store.get(id, { type: 'json' })) as Week | null
}

export async function saveWeek(week: Week): Promise<void> {
  const store = weeksStore()
  await store.setJSON(week.id, week)
}

export async function deleteWeek(id: string): Promise<void> {
  const store = weeksStore()
  await store.delete(id)
}

export async function deleteAllWeeks(): Promise<void> {
  const store = weeksStore()
  const { blobs } = await store.list()
  await Promise.all(blobs.map((b) => store.delete(b.key)))
}

export async function getStaleSince(): Promise<string | null> {
  const store = metaStore()
  const value = await store.get('staleSince', { type: 'text' })
  return value || null
}

export async function setStaleSince(date: string | null): Promise<void> {
  const store = metaStore()
  if (date === null) {
    await store.delete('staleSince')
  } else {
    await store.set('staleSince', date)
  }
}

function notesStore() {
  return getStore('notes')
}

export function normalizeNotes(raw: Record<string, any>): Record<string, UserNote> {
  const normalized: Record<string, UserNote> = {}
  for (const [username, val] of Object.entries(raw)) {
    if (typeof val === 'string') {
      normalized[username] = { content: val, stuck: false }
    } else {
      normalized[username] = {
        content: val?.content ?? '',
        stuck: Boolean(val?.stuck),
      }
    }
  }
  return normalized
}

export async function listNotes(): Promise<Record<string, Record<string, UserNote>>> {
  const store = notesStore()
  const { blobs } = await store.list()

  const result: Record<string, Record<string, UserNote>> = {}
  await Promise.all(
    blobs.map(async (b) => {
      const contentMap = await store.get(b.key, { type: 'json' })
      if (contentMap !== null) {
        result[b.key] = normalizeNotes(contentMap as Record<string, any>)
      }
    })
  )
  return result
}

export async function getNote(problemId: string): Promise<Record<string, UserNote>> {
  const store = notesStore()
  const val = await store.get(problemId, { type: 'json' })
  return normalizeNotes((val ?? {}) as Record<string, any>)
}

export async function saveNote(problemId: string, username: string, content: string, stuck: boolean = false): Promise<void> {
  const store = notesStore()
  const val = await getNote(problemId)
  
  if ((!content || content.trim() === '') && !stuck) {
    delete val[username]
  } else {
    val[username] = { content, stuck }
  }
  
  if (Object.keys(val).length === 0) {
    await store.delete(problemId)
  } else {
    await store.setJSON(problemId, val)
  }
}

export async function deleteNote(problemId: string): Promise<void> {
  const store = notesStore()
  await store.delete(problemId)
}

export async function deleteAllNotes(): Promise<void> {
  const store = notesStore()
  const { blobs } = await store.list()
  await Promise.all(blobs.map((b) => store.delete(b.key)))
}
