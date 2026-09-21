import {
  CalendarDays,
  FileUp,
  ListChecks,
  Settings2,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { defaultGroupName } from '../lib/appDefaults'
import { Brand } from './Brand'

const navigation = [
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/shortlist', label: 'Shortlist', icon: ListChecks },
  { to: '/app/import', label: 'Import', icon: FileUp },
  { to: '/app/group', label: 'Group', icon: Settings2 },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__top">
          <Brand to="/app/calendar" />
          <span className="preview-badge">Preview</span>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
            >
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__group-card">
          <span className="eyebrow">Your group</span>
          <strong>{defaultGroupName}</strong>
          <span>1 member · Eastern Time</span>
          <div className="avatar-row" aria-label="One group member">
            <span className="avatar avatar--small">ME</span>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="mobile-header">
          <Brand to="/app/calendar" />
          <span className="preview-badge">Preview</span>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
