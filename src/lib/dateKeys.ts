export interface CalendarDay {
  date: string
  dayOfMonth: number
  isInRange: boolean
}

export interface CalendarMonth {
  key: string
  label: string
  days: Array<CalendarDay | null>
}

const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

function parseDateKey(dateKey: string) {
  const match = dateKey.match(dateKeyPattern)

  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function toDateKey(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function toUtcDate(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(Date.UTC(year, month - 1, day))
}

export function todayInTimeZone(
  timeZone = 'America/New_York',
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value

  return `${valueFor('year')}-${valueFor('month')}-${valueFor('day')}`
}

export function addMonthsToDateKey(dateKey: string, months: number) {
  const { year, month, day } = parseDateKey(dateKey)
  const targetMonthStart = new Date(Date.UTC(year, month - 1 + months, 1))
  const targetYear = targetMonthStart.getUTCFullYear()
  const targetMonth = targetMonthStart.getUTCMonth() + 1
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()

  return toDateKey(targetYear, targetMonth, Math.min(day, lastDay))
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const value = toUtcDate(dateKey)
  value.setUTCDate(value.getUTCDate() + days)

  return toDateKey(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate(),
  )
}

export function dateKeysBetween(startDate: string, endDate: string) {
  if (endDate < startDate) {
    return []
  }

  const dates: string[] = []
  let cursor = startDate

  while (cursor <= endDate) {
    dates.push(cursor)
    cursor = addDaysToDateKey(cursor, 1)
  }

  return dates
}

export function isWeekend(dateKey: string) {
  const day = toUtcDate(dateKey).getUTCDay()
  return day === 0 || day === 6
}

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  },
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    ...options,
  }).format(toUtcDate(dateKey))
}

export function buildCalendarMonths(startDate: string, endDate: string) {
  const { year: startYear, month: startMonth } = parseDateKey(startDate)
  const { year: endYear, month: endMonth } = parseDateKey(endDate)
  const months: CalendarMonth[] = []
  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthIndex = month - 1
    const firstDay = new Date(Date.UTC(year, monthIndex, 1))
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const mondayFirstOffset = (firstDay.getUTCDay() + 6) % 7
    const days: Array<CalendarDay | null> = Array.from(
      { length: mondayFirstOffset },
      () => null,
    )

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = toDateKey(year, month, day)
      days.push({
        date,
        dayOfMonth: day,
        isInRange: date >= startDate && date <= endDate,
      })
    }

    while (days.length % 7 !== 0) {
      days.push(null)
    }

    months.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(firstDay),
      days,
    })

    month += 1
    if (month === 13) {
      month = 1
      year += 1
    }
  }

  return months
}

