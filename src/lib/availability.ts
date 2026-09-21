import {
  availabilityPeriods,
  type AvailabilityEntry,
  type AvailabilityPeriod,
  type DaySummary,
} from '../types/domain'
import { isWeekend } from './dateKeys'

const allPeriods = new Set<AvailabilityPeriod>(availabilityPeriods)

function entryPeriods(entry: AvailabilityEntry | undefined) {
  if (!entry) {
    return new Set<AvailabilityPeriod>()
  }

  return entry.status === 'full' ? new Set(allPeriods) : new Set(entry.periods)
}

function intersectPeriods(periodSets: Set<AvailabilityPeriod>[]) {
  if (periodSets.length === 0) {
    return []
  }

  return availabilityPeriods.filter((period) =>
    periodSets.every((set) => set.has(period)),
  )
}

export function summarizeDate(
  date: string,
  memberIds: string[],
  entries: AvailabilityEntry[],
): DaySummary {
  const entriesByMember = new Map(
    entries
      .filter((entry) => entry.date === date && memberIds.includes(entry.memberId))
      .map((entry) => [entry.memberId, entry]),
  )

  const fullMemberIds: string[] = []
  const partialMemberIds: string[] = []

  memberIds.forEach((memberId) => {
    const entry = entriesByMember.get(memberId)

    if (entry?.status === 'full') {
      fullMemberIds.push(memberId)
    } else if (entry?.status === 'partial') {
      partialMemberIds.push(memberId)
    }
  })

  const availableMemberIds = [...fullMemberIds, ...partialMemberIds]
  const commonPeriods = intersectPeriods(
    memberIds.map((memberId) => entryPeriods(entriesByMember.get(memberId))),
  )

  return {
    date,
    fullMemberIds,
    partialMemberIds,
    availableMemberIds,
    commonPeriods,
    everyoneHasOverlap:
      memberIds.length > 0 &&
      availableMemberIds.length === memberIds.length &&
      commonPeriods.length > 0,
  }
}

export function summarizeDates(
  dates: string[],
  memberIds: string[],
  entries: AvailabilityEntry[],
) {
  return dates.map((date) => summarizeDate(date, memberIds, entries))
}

export function rankBestDates(
  summaries: DaySummary[],
  options: { weekendsOnly?: boolean; limit?: number } = {},
) {
  const { weekendsOnly = false, limit = 5 } = options

  return summaries
    .filter(
      (summary) =>
        summary.availableMemberIds.length > 0 &&
        (!weekendsOnly || isWeekend(summary.date)),
    )
    .sort((a, b) => {
      if (b.fullMemberIds.length !== a.fullMemberIds.length) {
        return b.fullMemberIds.length - a.fullMemberIds.length
      }

      if (b.partialMemberIds.length !== a.partialMemberIds.length) {
        return b.partialMemberIds.length - a.partialMemberIds.length
      }

      return a.date.localeCompare(b.date)
    })
    .slice(0, limit)
}

