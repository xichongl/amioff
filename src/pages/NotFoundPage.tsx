import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function NotFoundPage() {
  return (
    <main className="not-found">
      <Brand />
      <span className="eyebrow">404</span>
      <h1>This day isn’t on the calendar.</h1>
      <p>The page you were looking for may have moved or never existed.</p>
      <Link className="button button--primary" to="/">
        <ArrowLeft size={18} aria-hidden="true" /> Back home
      </Link>
    </main>
  )
}

