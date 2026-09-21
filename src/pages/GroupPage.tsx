import { Copy, Link2, RefreshCw, ShieldCheck, UserMinus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { defaultGroupName, initialMembers } from '../lib/appDefaults'

export function GroupPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title={defaultGroupName}
        description="1 member · Eastern Time · You are the owner"
      />

      <div className="settings-layout">
        <section className="settings-card invite-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon"><Link2 /></span>
            <div>
              <h2>Reusable invite link</h2>
              <p>Anyone with this link can join after signing in.</p>
            </div>
          </div>
          <div className="invite-link">
            <code>amioff.pages.dev/join/real-weekend-••••••</code>
            <button className="button button--primary" type="button"><Copy size={17} /> Copy</button>
          </div>
          <button className="text-button text-button--danger" type="button">
            <RefreshCw size={15} /> Regenerate and disable the old link
          </button>
        </section>

        <section className="settings-card members-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon"><ShieldCheck /></span>
            <div>
              <h2>Group members</h2>
              <p>Members can see one another’s confirmed availability.</p>
            </div>
          </div>
          <div className="member-list">
            {initialMembers.map((member) => (
              <div className="member-row" key={member.id}>
                <span className="avatar" style={{ background: member.color }}>{member.initials}</span>
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.isCurrentUser ? 'Owner · you' : 'Member'}</small>
                </span>
                {!member.isCurrentUser && (
                  <button className="icon-button icon-button--danger" type="button" aria-label={`Remove ${member.name}`}>
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
