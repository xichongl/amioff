import { Link } from 'react-router-dom'

interface BrandProps {
  compact?: boolean
  to?: string
}

export function Brand({ compact = false, to = '/' }: BrandProps) {
  return (
    <Link className="brand" to={to} aria-label="Amioff home">
      <svg
        className="brand__mark"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
      >
        <rect width="48" height="48" rx="13" fill="currentColor" />
        <path
          d="M12 27.5c0-9.1 5.5-15.8 13-15.8 6.7 0 11.9 5 11.9 12.1 0 7.2-4.7 12.6-11.7 12.6-4 0-7.2-1.5-9.2-4.2"
          stroke="var(--surface)"
          strokeWidth="4.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M12 27.7h15.7"
          stroke="var(--jade-400)"
          strokeWidth="4.8"
          strokeLinecap="round"
        />
        <circle cx="36.2" cy="13.3" r="3" fill="var(--amber-400)" />
      </svg>
      {!compact && <span className="brand__wordmark">amioff</span>}
    </Link>
  )
}

