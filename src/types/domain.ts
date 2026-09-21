export const availabilityPeriods = ['morning', 'afternoon', 'evening'] as const

export type AvailabilityPeriod = (typeof availabilityPeriods)[number]

export type AvailabilityStatus = 'full' | 'partial'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
  isCurrentUser?: boolean
}

export interface AvailabilityEntry {
  memberId: string
  date: string
  status: AvailabilityStatus
  periods: AvailabilityPeriod[]
  source: 'manual' | 'ics' | 'spreadsheet' | 'pdf' | 'image'
}

export interface DaySummary {
  date: string
  fullMemberIds: string[]
  partialMemberIds: string[]
  availableMemberIds: string[]
  commonPeriods: AvailabilityPeriod[]
  everyoneHasOverlap: boolean
}

export interface ShortlistItem {
  id: string
  date: string
  title: string
  note?: string
  createdBy: string
}

