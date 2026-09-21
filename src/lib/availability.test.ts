import type { AvailabilityEntry } from '../types/domain'
import { rankBestDates, summarizeDate } from './availability'

const entries: AvailabilityEntry[] = [
  {
    memberId: 'a',
    date: '2026-09-21',
    status: 'full',
    periods: [],
    source: 'manual',
  },
  {
    memberId: 'b',
    date: '2026-09-21',
    status: 'partial',
    periods: ['afternoon', 'evening'],
    source: 'manual',
  },
  {
    memberId: 'a',
    date: '2026-09-22',
    status: 'partial',
    periods: ['morning'],
    source: 'manual',
  },
  {
    memberId: 'b',
    date: '2026-09-22',
    status: 'partial',
    periods: ['evening'],
    source: 'manual',
  },
]

describe('availability summaries', () => {
  it('treats a full day as available in every period', () => {
    const summary = summarizeDate('2026-09-21', ['a', 'b'], entries)

    expect(summary.everyoneHasOverlap).toBe(true)
    expect(summary.commonPeriods).toEqual(['afternoon', 'evening'])
    expect(summary.fullMemberIds).toEqual(['a'])
    expect(summary.partialMemberIds).toEqual(['b'])
  })

  it('does not report overlap when partial periods do not intersect', () => {
    const summary = summarizeDate('2026-09-22', ['a', 'b'], entries)

    expect(summary.everyoneHasOverlap).toBe(false)
    expect(summary.commonPeriods).toEqual([])
  })

  it('ranks full availability ahead of partial availability', () => {
    const summaries = [
      summarizeDate('2026-09-22', ['a', 'b'], entries),
      summarizeDate('2026-09-21', ['a', 'b'], entries),
    ]

    expect(rankBestDates(summaries, { limit: 2 })[0].date).toBe('2026-09-21')
  })
})

