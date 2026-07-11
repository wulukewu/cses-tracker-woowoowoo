import { getStore } from '@netlify/blobs'
import type { Week } from '~~/shared/types'

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
