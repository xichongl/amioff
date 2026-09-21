import {
  CalendarRange,
  FileImage,
  FileSpreadsheet,
  LockKeyhole,
  UploadCloud,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'

const importOptions = [
  {
    title: 'Calendar file',
    formats: '.ics',
    description: 'Import time off or work shifts from a calendar export.',
    icon: CalendarRange,
    tone: 'jade',
  },
  {
    title: 'Spreadsheet',
    formats: '.csv, .xlsx',
    description: 'Map date, status, and schedule-code columns before saving.',
    icon: FileSpreadsheet,
    tone: 'indigo',
  },
  {
    title: 'PDF or screenshot',
    formats: '.pdf, .png, .jpg',
    description: 'Run best-effort text recognition locally, then review every date.',
    icon: FileImage,
    tone: 'amber',
  },
]

export function ImportPage() {
  return (
    <div>
      <PageHeader
        eyebrow="My availability"
        title="Import a schedule"
        description="Bring in the file you already have. Nothing is saved until you review it."
      />

      <section className="privacy-banner">
        <span className="privacy-banner__icon"><LockKeyhole size={19} /></span>
        <div>
          <strong>Your source file stays on this device.</strong>
          <p>Amioff processes imports in your browser and saves only the availability you confirm.</p>
        </div>
      </section>

      <div className="import-grid">
        {importOptions.map(({ title, formats, description, icon: Icon, tone }) => (
          <article className="import-card" key={title}>
            <span className={`import-card__icon import-card__icon--${tone}`}><Icon /></span>
            <span className="eyebrow">{formats}</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <button className="button button--secondary button--wide" type="button">
              <UploadCloud size={18} /> Choose file
            </button>
            <small>Importer implementation is scheduled after the core calendar.</small>
          </article>
        ))}
      </div>

      <section className="import-steps">
        <span className="eyebrow">Every import follows the same safe path</span>
        <div>
          {[
            ['01', 'Choose the meaning', 'Tell Amioff whether entries are time off, work shifts, or schedule codes.'],
            ['02', 'Review the results', 'Correct dates and resolve conflicts in an editable preview.'],
            ['03', 'Confirm once', 'Only approved full and partial availability reaches the group.'],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

