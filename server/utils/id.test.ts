import { describe, expect, it } from 'vitest'
import { shortId } from './id'

describe('shortId', () => {
  it('generates URL-safe, non-empty ids', () => {
    const id = shortId()
    expect(id.length).toBeGreaterThan(0)
    expect(id).toMatch(/^[a-z0-9]+$/)
  })

  it('generates distinct ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => shortId()))
    expect(ids.size).toBe(20)
  })
})
