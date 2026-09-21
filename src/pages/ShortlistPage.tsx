import { ArrowLeft, CalendarHeart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { defaultGroupName } from '../lib/appDefaults'

export function ShortlistPage() {
  return (
    <div>
      <PageHeader
        eyebrow={defaultGroupName}
        title="Shared shortlist"
        description="Keep the promising dates in one place before the group decides."
      />

      <section className="shortlist-empty">
        <span className="shortlist-empty__icon"><CalendarHeart /></span>
        <span className="eyebrow">Nothing saved yet</span>
        <h2>Your shortlist is empty</h2>
        <p>
          When your group finds a date worth considering, save it here with a
          short title or note.
        </p>
        <Link className="button button--primary" to="/app/calendar">
          <ArrowLeft size={17} /> Back to calendar
        </Link>
      </section>
    </div>
  )
}
