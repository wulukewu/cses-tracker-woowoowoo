import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from './concurrency'

describe('mapWithConcurrency', () => {
  it('keeps results in the order of the input, not completion order', async () => {
    const result = await mapWithConcurrency([30, 10, 20, 0], 4, async (ms, i) => {
      await new Promise((r) => setTimeout(r, ms))
      return `${i}:${ms}`
    })

    expect(result).toEqual(['0:30', '1:10', '2:20', '3:0'])
  })

  it('never exceeds the limit, which is what keeps cses.fi from seeing a burst', async () => {
    let inFlight = 0
    let peak = 0

    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 3, async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
    })

    expect(peak).toBe(3)
  })

  it('still processes every item when there are more items than the limit', async () => {
    const seen: number[] = []

    await mapWithConcurrency(Array.from({ length: 25 }, (_, i) => i), 4, async (n) => {
      seen.push(n)
    })

    expect(seen).toHaveLength(25)
    expect(new Set(seen).size).toBe(25)
  })

  it('returns an empty array without running anything for no items', async () => {
    let calls = 0
    const result = await mapWithConcurrency([], 4, async () => { calls++ })

    expect(result).toEqual([])
    expect(calls).toBe(0)
  })
})
