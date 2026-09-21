import { Check, CircleSlash2, Clock3, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDateKey } from '../lib/dateKeys'
import {
  availabilityPeriods,
  type AvailabilityEntry,
  type AvailabilityPeriod,
  type AvailabilityStatus,
} from '../types/domain'

type AvailabilityChoice = AvailabilityStatus | 'unavailable'

interface AvailabilityDialogProps {
  date: string
  initialEntry?: AvailabilityEntry
  onCancel: () => void
  onClear: () => void
  onSave: (status: AvailabilityStatus, periods: AvailabilityPeriod[]) => void
}

const periodDescriptions: Record<AvailabilityPeriod, string> = {
  morning: 'Before noon',
  afternoon: 'Midday and afternoon',
  evening: 'After work hours',
}

const availabilityChoices: Array<{
  value: AvailabilityChoice
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'full',
    label: 'Full day',
    description: 'Free morning, afternoon, and evening',
    icon: Sun,
  },
  {
    value: 'partial',
    label: 'Partial day',
    description: 'Choose the parts of the day that work',
    icon: Clock3,
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    description: 'Clear any availability saved for this date',
    icon: CircleSlash2,
  },
]

export function AvailabilityDialog({
  date,
  initialEntry,
  onCancel,
  onClear,
  onSave,
}: AvailabilityDialogProps) {
  const [choice, setChoice] = useState<AvailabilityChoice>(
    initialEntry?.status ?? 'unavailable',
  )
  const [periods, setPeriods] = useState<AvailabilityPeriod[]>(
    initialEntry?.status === 'partial' ? initialEntry.periods : [],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function togglePeriod(period: AvailabilityPeriod) {
    setPeriods((current) =>
      current.includes(period)
        ? current.filter((value) => value !== period)
        : [...current, period],
    )
  }

  function handleSave() {
    if (choice === 'unavailable') {
      onClear()
      return
    }

    onSave(choice, choice === 'full' ? [] : periods)
  }

  const canSave = choice !== 'partial' || periods.length > 0

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="availability-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button availability-dialog__close"
          type="button"
          onClick={onCancel}
          aria-label="Close availability editor"
        >
          <X size={19} aria-hidden="true" />
        </button>
        <span className="eyebrow">Your availability</span>
        <h2 id="availability-dialog-title">Set this date</h2>
        <p>
          {formatDateKey(date, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <div className="availability-choices" aria-label="Availability type">
          {availabilityChoices.map(({ value, label, description, icon: Icon }) => {
            const isSelected = choice === value

            return (
              <button
                key={value}
                className={`availability-choice${
                  isSelected ? ' availability-choice--selected' : ''
                }`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setChoice(value)}
              >
                <span className="availability-choice__icon"><Icon size={19} /></span>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <span className="availability-choice__check" aria-hidden="true">
                  {isSelected && <Check size={15} strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>

        {choice === 'partial' && (
          <div className="partial-periods">
            <span className="partial-periods__label">Which times work?</span>
            <div className="period-options">
              {availabilityPeriods.map((period) => {
                const isSelected = periods.includes(period)
                return (
                  <button
                    key={period}
                    className={`period-option${
                      isSelected ? ' period-option--selected' : ''
                    }`}
                    type="button"
                    aria-label={`${period} availability`}
                    aria-pressed={isSelected}
                    onClick={() => togglePeriod(period)}
                  >
                    <span>
                      <strong>{period}</strong>
                      <small>{periodDescriptions[period]}</small>
                    </span>
                    <span className="period-option__check" aria-hidden="true">
                      {isSelected && <Check size={16} strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
            {periods.length === 0 && (
              <small className="partial-periods__hint">
                Choose at least one time period to save a partial day.
              </small>
            )}
          </div>
        )}

        <div className="dialog-actions">
          <button className="button button--ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="button button--primary"
            type="button"
            disabled={!canSave}
            onClick={handleSave}
          >
            Save availability
          </button>
        </div>
      </section>
    </div>
  )
}
