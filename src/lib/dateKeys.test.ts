import {
  addMonthsToDateKey,
  buildCalendarMonths,
  dateKeysBetween,
  todayInTimeZone,
} from './dateKeys'

describe('date key helpers', () => {
  it('clamps end-of-month dates when adding months', () => {
    expect(addMonthsToDateKey('2026-01-31', 3)).toBe('2026-04-30')
    expect(addMonthsToDateKey('2024-01-31', 1)).toBe('2024-02-29')
  })

  it('builds an inclusive date range', () => {
    expect(dateKeysBetween('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('uses the configured timezone to determine today', () => {
    const instant = new Date('2026-09-21T02:00:00.000Z')
    expect(todayInTimeZone('America/New_York', instant)).toBe('2026-09-20')
  })

  it('marks dates outside a partial-month window as inactive', () => {
    const months = buildCalendarMonths('2026-09-21', '2026-10-03')
    const september = months[0]
    const twentieth = september.days.find(
      (day) => day?.date === '2026-09-20',
    )
    const twentyFirst = september.days.find(
      (day) => day?.date === '2026-09-21',
    )

    expect(twentieth?.isInRange).toBe(false)
    expect(twentyFirst?.isInRange).toBe(true)
  })
})

