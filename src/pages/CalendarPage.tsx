import {
  CalendarDays,
  CalendarPlus2,
  Check,
  ChevronRight,
  Filter,
  ListFilter,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvailabilityDialog } from '../components/AvailabilityDialog'
import { PageHeader } from '../components/PageHeader'
import { rankBestDates, summarizeDates } from '../lib/availability'
import {
  currentMemberId,
  defaultGroupName,
  initialMembers,
} from '../lib/appDefaults'
import {
  addMonthsToDateKey,
  buildCalendarMonths,
  dateKeysBetween,
  formatDateKey,
  isWeekend,
  todayInTimeZone,
} from '../lib/dateKeys'
import type {
  AvailabilityEntry,
  AvailabilityPeriod,
  DaySummary,
} from '../types/domain'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarDayButtonProps {
  date: string
  dayOfMonth: number
  isInRange: boolean
  isToday: boolean
  summary?: DaySummary
  ownEntry?: AvailabilityEntry
  memberCount: number
  onClick: (date: string) => void
}

function CalendarDayButton({
  date,
  dayOfMonth,
  isInRange,
  isToday,
  summary,
  ownEntry,
  memberCount,
  onClick,
}: CalendarDayButtonProps) {
  const fullCount = summary?.fullMemberIds.length ?? 0
  const partialCount = summary?.partialMemberIds.length ?? 0
  const strength = memberCount === 0 ? 0 : fullCount / memberCount
  const ownStatus = ownEntry?.status ?? 'unavailable'
  const ariaLabel = `${formatDateKey(date, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })}: ${fullCount} fully available, ${partialCount} partially available. Your status: ${ownStatus}.`

  return (
    <button
      className={`calendar-day${isToday ? ' calendar-day--today' : ''}${
        summary?.everyoneHasOverlap ? ' calendar-day--overlap' : ''
      }${ownEntry ? ` calendar-day--own-${ownEntry.status}` : ''}`}
      style={{ '--day-strength': strength } as React.CSSProperties}
      type="button"
      disabled={!isInRange}
      onClick={() => onClick(date)}
      aria-label={ariaLabel}
    >
      <span className="calendar-day__number">{dayOfMonth}</span>
      {isToday && <span className="calendar-day__today-label">Today</span>}
      {(fullCount > 0 || partialCount > 0) && (
        <span className="calendar-day__counts" aria-hidden="true">
          {fullCount > 0 && (
            <span className="count-pill count-pill--full">{fullCount}</span>
          )}
          {partialCount > 0 && (
            <span className="count-pill count-pill--partial">{partialCount}</span>
          )}
        </span>
      )}
      {ownEntry && (
        <span
          className={`own-status own-status--${ownEntry.status}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

interface BestDateCardProps {
  summary: DaySummary
  memberCount: number
}

function BestDateCard({ summary, memberCount }: BestDateCardProps) {
  const dateLabel = formatDateKey(summary.date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const isEveryoneAvailable = summary.availableMemberIds.length === memberCount

  return (
    <article className="best-match-card">
      <div className="best-match-card__date">
        <span>{dateLabel.split(',')[0]}</span>
        <strong>{summary.date.slice(-2)}</strong>
      </div>
      <div className="best-match-card__content">
        <div className="best-match-card__title">
          <strong>{isEveryoneAvailable ? 'Everyone is free' : `${summary.availableMemberIds.length} can make it`}</strong>
          {summary.everyoneHasOverlap && (
            <span className="success-badge"><Check size={13} /> Shared time</span>
          )}
        </div>
        <p>
          <span><i className="legend-dot legend-dot--full" /> {summary.fullMemberIds.length} full</span>
          <span><i className="legend-dot legend-dot--partial" /> {summary.partialMemberIds.length} partial</span>
        </p>
        {summary.commonPeriods.length > 0 && (
          <small>Common: {summary.commonPeriods.join(' · ')}</small>
        )}
      </div>
      <button className="icon-button" type="button" aria-label={`View ${dateLabel}`}>
        <ChevronRight size={19} />
      </button>
    </article>
  )
}

export function CalendarPage() {
  const startDate = useMemo(() => todayInTimeZone(), [])
  const endDate = useMemo(() => addMonthsToDateKey(startDate, 3), [startDate])
  const dates = useMemo(
    () => dateKeysBetween(startDate, endDate),
    [startDate, endDate],
  )
  const months = useMemo(
    () => buildCalendarMonths(startDate, endDate),
    [startDate, endDate],
  )
  const [entries, setEntries] = useState<AvailabilityEntry[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState(() =>
    initialMembers.map((member) => member.id),
  )
  const [weekendsOnly, setWeekendsOnly] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)

  const visibleDates = useMemo(
    () => (weekendsOnly ? dates.filter(isWeekend) : dates),
    [dates, weekendsOnly],
  )

  const summaries = useMemo(
    () => summarizeDates(visibleDates, selectedMemberIds, entries),
    [visibleDates, selectedMemberIds, entries],
  )
  const summaryByDate = useMemo(
    () => new Map(summaries.map((summary) => [summary.date, summary])),
    [summaries],
  )
  const bestDates = useMemo(
    () => rankBestDates(summaries, { weekendsOnly, limit: 3 }),
    [summaries, weekendsOnly],
  )
  const ownEntryByDate = useMemo(
    () =>
      new Map(
        entries
          .filter((entry) => entry.memberId === currentMemberId)
          .map((entry) => [entry.date, entry]),
      ),
    [entries],
  )

  function setOwnEntry(
    date: string,
    status: 'full' | 'partial',
    periods: AvailabilityPeriod[] = [],
  ) {
    setEntries((current) => [
      ...current.filter(
        (entry) => !(entry.memberId === currentMemberId && entry.date === date),
      ),
      {
        memberId: currentMemberId,
        date,
        status,
        periods,
        source: 'manual',
      },
    ])
  }

  function clearOwnEntry(date: string) {
    setEntries((current) =>
      current.filter(
        (entry) => !(entry.memberId === currentMemberId && entry.date === date),
      ),
    )
  }

  function handleDateClick(date: string) {
    setEditingDate(date)
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) {
        return current.length === 1
          ? current
          : current.filter((id) => id !== memberId)
      }

      return [...current, memberId]
    })
  }

  function selectEveryone() {
    setSelectedMemberIds(initialMembers.map((member) => member.id))
  }

  const allSelected = selectedMemberIds.length === initialMembers.length

  return (
    <div className="calendar-page">
      <PageHeader
        eyebrow={defaultGroupName}
        title="Find your overlap"
        description={`${formatDateKey(startDate, { month: 'long', day: 'numeric' })} through ${formatDateKey(endDate, { month: 'long', day: 'numeric', year: 'numeric' })} · Eastern Time`}
        actions={
          <Link className="button button--secondary" to="/app/import">
            <CalendarPlus2 size={18} aria-hidden="true" /> Import schedule
          </Link>
        }
      />

      <section className="control-panel" aria-label="Calendar filters">
        <div className="control-panel__heading">
          <span><UsersRound size={18} /> Compare friends</span>
          <button
            className="text-button"
            type="button"
            onClick={selectEveryone}
            disabled={allSelected}
          >
            Select everyone
          </button>
        </div>
        <div className="member-filters">
          {initialMembers.map((member) => {
            const isSelected = selectedMemberIds.includes(member.id)
            return (
              <button
                type="button"
                className={`member-filter${isSelected ? ' member-filter--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => toggleMember(member.id)}
                key={member.id}
              >
                <span className="avatar" style={{ background: member.color }}>
                  {member.initials}
                </span>
                <span>{member.name}</span>
                <span className="member-filter__check" aria-hidden="true">
                  {isSelected && <Check size={13} strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
        <p className="member-filter-note">Friends will appear here after they join.</p>
        <div className="filter-row">
          <span className="legend-inline">
            <i className="legend-dot legend-dot--full" /> Fully available
            <i className="legend-dot legend-dot--partial" /> Partially available
          </span>
          <label className="switch-control">
            <input
              type="checkbox"
              checked={weekendsOnly}
              onChange={(event) => setWeekendsOnly(event.target.checked)}
            />
            <span className="switch" aria-hidden="true" />
            <span>Weekends only</span>
          </label>
        </div>
      </section>

      <div className="calendar-layout">
        <section className="calendar-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Select a date to set availability</span>
              <h2>Next three months</h2>
            </div>
            <span className="availability-hint">
              Full day, partial day, or unavailable
            </span>
          </div>

          <div className="month-list">
            {months.map((month) => (
              <article className="month-card" key={month.key}>
                <header>
                  <h3>{month.label}</h3>
                  <span>{selectedMemberIds.length} selected</span>
                </header>
                <div className="calendar-weekdays" aria-hidden="true">
                  {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
                </div>
                <div className="calendar-grid">
                  {month.days.map((day, index) =>
                    day ? (
                      <CalendarDayButton
                        key={day.date}
                        {...day}
                        isToday={day.date === startDate}
                        summary={summaryByDate.get(day.date)}
                        ownEntry={ownEntryByDate.get(day.date)}
                        memberCount={selectedMemberIds.length}
                        onClick={handleDateClick}
                      />
                    ) : (
                      <span className="calendar-day calendar-day--blank" key={`blank-${index}`} />
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="best-dates-panel">
          <div className="best-dates-panel__heading">
            <span className="sparkle-icon"><Sparkles size={18} /></span>
            <div>
              <span className="eyebrow">Strongest overlap</span>
              <h2>Best upcoming dates</h2>
            </div>
          </div>
          <p className="best-dates-panel__intro">
            Ranked by full availability, then partial availability.
          </p>

          <div className="best-match-list">
            {bestDates.length > 0 ? (
              bestDates.map((summary) => (
                <BestDateCard
                  key={summary.date}
                  summary={summary}
                  memberCount={selectedMemberIds.length}
                />
              ))
            ) : (
              <div className="best-dates-empty">
                <span><CalendarDays size={22} /></span>
                <strong>No dates yet</strong>
                <p>Set your availability to start seeing the strongest options.</p>
              </div>
            )}
          </div>

          <button className="button button--soft button--wide" type="button" disabled={bestDates.length === 0}>
            <ListFilter size={17} /> View all ranked dates
          </button>

          <div className="best-dates-panel__tip">
            <Filter size={17} />
            <p><strong>Looking for a smaller crew?</strong> Tap friends above to recalculate every date instantly.</p>
          </div>
        </aside>
      </div>

      {editingDate && (
        <AvailabilityDialog
          date={editingDate}
          initialEntry={ownEntryByDate.get(editingDate)}
          onCancel={() => setEditingDate(null)}
          onClear={() => {
            clearOwnEntry(editingDate)
            setEditingDate(null)
          }}
          onSave={(status, periods) => {
            setOwnEntry(editingDate, status, periods)
            setEditingDate(null)
          }}
        />
      )}
    </div>
  )
}
