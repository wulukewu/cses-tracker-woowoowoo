import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached } from './cache'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cached', () => {
  it('calls fn once and reuses the cached value on a second call with the same key', async () => {
    const fn = vi.fn().mockResolvedValue('value')

    expect(await cached('key-a', fn)).toBe('value')
    expect(await cached('key-a', fn)).toBe('value')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('re-runs fn once the TTL has elapsed', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    expect(await cached('key-b', fn)).toBe('first')
    vi.advanceTimersByTime(7 * 60 * 1000 + 1)
    expect(await cached('key-b', fn)).toBe('second')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('bypasses the cache when force is true', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    expect(await cached('key-c', fn)).toBe('first')
    expect(await cached('key-c', fn, { force: true })).toBe('second')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('keeps separate entries per key', async () => {
    const fn = vi.fn().mockResolvedValueOnce('for-x').mockResolvedValueOnce('for-y')

    expect(await cached('key-x', fn)).toBe('for-x')
    expect(await cached('key-y', fn)).toBe('for-y')
  })
})
