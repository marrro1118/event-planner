import { describe, expect, it } from 'vitest'
import { findPlans, toHHMM, toMinutes, type Show } from './schedule'

describe('toMinutes / toHHMM', () => {
  it('converts HH:MM to minutes and back', () => {
    expect(toMinutes('9:05')).toBe(545)
    expect(toMinutes('23:59')).toBe(1439)
    expect(toHHMM(545)).toBe('9:05')
    expect(toHHMM(0)).toBe('0:00')
  })

  it('rejects malformed or out-of-range times', () => {
    expect(() => toMinutes('abc')).toThrow()
    expect(() => toMinutes('24:00')).toThrow()
    expect(() => toMinutes('10:60')).toThrow()
  })
})

const SHOWS: Show[] = [
  {
    id: 'a',
    title: 'A',
    venue: 'v1',
    slots: [{ day: 'day1', start: '10:00', end: '11:00' }],
  },
  {
    id: 'b',
    title: 'B',
    venue: 'v1',
    slots: [{ day: 'day1', start: '11:30', end: '12:30' }],
  },
  {
    id: 'c',
    title: 'C',
    venue: 'v2',
    // overlaps with both A and B's only slot
    slots: [{ day: 'day1', start: '10:30', end: '13:00' }],
  },
]

describe('findPlans', () => {
  it('returns no plans when nothing is ranked', () => {
    const result = findPlans(SHOWS, {}, { day: 'day1' })
    expect(result.plans).toEqual([])
    expect(result.tooManyShows).toBe(false)
  })

  it('combines non-overlapping shows that fit with the buffer', () => {
    const result = findPlans(SHOWS, { a: 'must', b: 'must' }, { day: 'day1', bufferMin: 10 })
    expect(result.plans).toHaveLength(1)
    const plan = result.plans[0]
    expect(plan.items.map((i) => i.showId)).toEqual(['a', 'b'])
    expect(plan.score.must).toBe(2)
    expect(plan.items[0].gapAfterMin).toBe(30)
  })

  it('drops a slot when the gap is smaller than the required buffer', () => {
    // A ends 11:00, B starts 11:30 -> 30min gap, fails with a 45min buffer requirement
    const result = findPlans(SHOWS, { a: 'must', b: 'must' }, { day: 'day1', bufferMin: 45 })
    // no single plan contains both; each show alone is maximal
    expect(result.plans.every((p) => p.items.length === 1)).toBe(true)
  })

  it('only offers one of two mutually-overlapping shows per plan', () => {
    const result = findPlans(SHOWS, { a: 'must', c: 'want' }, { day: 'day1' })
    for (const plan of result.plans) {
      expect(plan.items).toHaveLength(1)
    }
    // both a-only and c-only should appear as maximal plans
    expect(result.plans.map((p) => p.key).sort()).toEqual(['a', 'c'])
  })

  it('ranks plans by must > want > maybe count, then by less idle time', () => {
    const result = findPlans(SHOWS, { a: 'must', b: 'want' }, { day: 'day1' })
    expect(result.plans[0].items.map((i) => i.showId)).toEqual(['a', 'b'])
  })

  it('ignores slots on other days', () => {
    const result = findPlans(SHOWS, { a: 'must' }, { day: 'day2' })
    expect(result.plans).toEqual([])
  })

  it('flags tooManyShows instead of exploding when too many are ranked', () => {
    const many: Show[] = Array.from({ length: 19 }, (_, i) => ({
      id: `s${i}`,
      title: `S${i}`,
      venue: 'v',
      slots: [{ day: 'day1', start: '10:00', end: '10:30' }],
    }))
    const ranks = Object.fromEntries(many.map((s) => [s.id, 'want' as const]))
    const result = findPlans(many, ranks, { day: 'day1' })
    expect(result.tooManyShows).toBe(true)
    expect(result.plans).toEqual([])
  })
})
