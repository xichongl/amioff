import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AvailabilityDialog } from './AvailabilityDialog'

describe('AvailabilityDialog', () => {
  it('saves an explicit full-day selection', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <AvailabilityDialog
        date="2026-09-26"
        onCancel={vi.fn()}
        onClear={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: /full day/i }))
    await user.click(screen.getByRole('button', { name: /save availability/i }))

    expect(onSave).toHaveBeenCalledWith('full', [])
  })

  it('requires and saves selected partial-day periods', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <AvailabilityDialog
        date="2026-09-26"
        onCancel={vi.fn()}
        onClear={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: /partial day/i }))
    expect(screen.getByRole('button', { name: /save availability/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /morning availability/i }))
    await user.click(screen.getByRole('button', { name: /evening availability/i }))
    await user.click(screen.getByRole('button', { name: /save availability/i }))

    expect(onSave).toHaveBeenCalledWith('partial', ['morning', 'evening'])
  })

  it('clears an existing entry when unavailable is selected', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    render(
      <AvailabilityDialog
        date="2026-09-26"
        initialEntry={{
          memberId: 'current-user',
          date: '2026-09-26',
          status: 'full',
          periods: [],
          source: 'manual',
        }}
        onCancel={vi.fn()}
        onClear={onClear}
        onSave={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /unavailable/i }))
    await user.click(screen.getByRole('button', { name: /save availability/i }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})
