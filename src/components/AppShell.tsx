import {
  CalendarDays,
  FileUp,
  ListChecks,
  LogIn,
  LogOut,
  Settings2,
  UserPlus,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'
import { Brand } from './Brand'

const navigation = [
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/shortlist', label: 'Shortlist', icon: ListChecks },
  { to: '/app/import', label: 'Import', icon: FileUp },
  { to: '/app/group', label: 'Group', icon: Settings2 },
]

export function AppShell() {
  const {
    currentUser,
    members,
    groupName,
    isLoggedIn,
    openAuthModal,
    logout,
  } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__top">
          <Brand to="/app/calendar" />
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
          <strong>{groupName}</strong>
          <span>{members.length} {members.length === 1 ? 'member' : 'members'} · Eastern Time</span>
          <div className="avatar-row" aria-label={`${members.length} group members`}>
            {members.slice(0, 5).map((m, idx) => (
              <span
                key={m.id}
                className="avatar avatar--small"
                style={{
                  background: m.color,
                  zIndex: 5 - idx,
                }}
                title={m.name}
              >
                {m.initials}
              </span>
            ))}
            {members.length > 5 && (
              <span className="avatar avatar--small avatar--more">
                +{members.length - 5}
              </span>
            )}
          </div>
        </div>

        {isLoggedIn && currentUser ? (
          <div className="user-badge-bar">
            <div className="user-badge-bar__info">
              <span
                className="avatar avatar--small"
                style={{ background: currentUser.color, marginLeft: 0 }}
              >
                {currentUser.initials}
              </span>
              <div style={{ minWidth: 0 }}>
                <span className="user-badge-bar__name">{currentUser.name}</span>
                <span className="user-badge-bar__role">
                  {currentUser.role === 'owner' ? 'Group Owner' : 'Member'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={logout}
              title="Sign out / Switch account"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button--primary button--wide"
            style={{ marginTop: '0.75rem' }}
            onClick={() => openAuthModal('register')}
          >
            <UserPlus size={16} /> Join / Sign In
          </button>
        )}
      </aside>

      <div className="app-content">
        <header className="mobile-header">
          <Brand to="/app/calendar" />
          {isLoggedIn && currentUser ? (
            <button
              type="button"
              className="button button--quiet"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              onClick={logout}
            >
              <LogOut size={15} /> {currentUser.name.split(' ')[0]}
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => openAuthModal('register')}
            >
              <LogIn size={15} /> Sign In
            </button>
          )}
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

      <AuthModal />
    </div>
  )
}
