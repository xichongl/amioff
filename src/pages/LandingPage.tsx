import {
  ArrowRight,
  CalendarCheck2,
  Check,
  MousePointerClick,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

const exampleDays = ['12', '13', '14', '15', '16', '17', '18']

export function LandingPage() {
  const { currentUser, groupName, isLoggedIn } = useAuth()

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Brand />
        <Link className="button button--quiet" to="/app/calendar">
          {isLoggedIn && currentUser ? `Open calendar (${currentUser.name.split(' ')[0]})` : 'Open calendar'} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </nav>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="hero__pill">
              <span className="pulse-dot" /> Built for busy schedules
            </span>
            <h1>
              Find the days when
              <span> everyone is off.</span>
            </h1>
            <p>
              One calm place for your group to compare time off, find the best
              overlap, and finally make the plan happen.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary button--large" to="/app/calendar">
                {isLoggedIn && currentUser ? `Continue as ${currentUser.name}` : 'Open the calendar'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <span className="hero__note">
                <Check size={16} aria-hidden="true" /> Simple & private — sign in with your name & PIN
              </span>
            </div>
          </div>

          <div className="hero-preview" aria-label="Availability calendar preview">
            <div className="hero-preview__glow" />
            <div className="preview-window">
              <div className="preview-window__top">
                <div>
                  <span className="eyebrow">{groupName}</span>
                  <strong>Best days ahead</strong>
                </div>
                <span className="preview-badge">Live Planner</span>
              </div>

              <div className="mini-calendar">
                <div className="mini-calendar__heading">
                  <span>October</span>
                  <span className="legend-inline">
                    <i className="legend-dot legend-dot--full" /> Full
                    <i className="legend-dot legend-dot--partial" /> Partial
                  </span>
                </div>
                <div className="mini-calendar__weekdays">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                </div>
                <div className="mini-calendar__days">
                  {exampleDays.map((day) => (
                    <div className="mini-day mini-day--0" key={day}>
                      <span>{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="best-day-card">
                <span className="best-day-card__date"><CalendarCheck2 size={22} /></span>
                <span>
                  <strong>Your best dates will appear here</strong>
                  <small>Add availability to start comparing.</small>
                </span>
                <span className="best-day-card__badge">Ready when you are</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features" aria-label="How Amioff works">
          <article>
            <span className="feature-icon"><MousePointerClick /></span>
            <div>
              <strong>Tap in your time off</strong>
              <p>Full day, morning, afternoon, or evening. It takes seconds.</p>
            </div>
          </article>
          <article>
            <span className="feature-icon"><UsersRound /></span>
            <div>
              <strong>Compare the people who matter</strong>
              <p>See the whole group or narrow it down to particular friends.</p>
            </div>
          </article>
          <article>
            <span className="feature-icon"><CalendarCheck2 /></span>
            <div>
              <strong>Save the dates that work</strong>
              <p>Shortlist the best overlap before another month gets away.</p>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
