import { useEffect, useState } from 'react'
import { Check, Copy, Link2, RefreshCw, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function GroupPage() {
  const { currentUser, members, groupName } = useAuth()
  const [inviteCode, setInviteCode] = useState('real-weekend')
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    let isMounted = true
    api.getGroupInfo()
      .then((info) => {
        if (isMounted && info.inviteCode) {
          setInviteCode(info.inviteCode)
        }
      })
      .catch((err) => console.warn('Could not fetch group info:', err))
    return () => {
      isMounted = false
    }
  }, [])

  const fullInviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/app/calendar?join=${inviteCode}`
    : `https://amioff.pages.dev/app/calendar?join=${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullInviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is blocked
      const input = document.createElement('input')
      input.value = fullInviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (!currentUser || currentUser.role !== 'owner') {
      alert('Only the group owner can regenerate the invite link.')
      return
    }
    if (!confirm('Regenerating will invalidate the previous invite link. Proceed?')) {
      return
    }

    setIsRegenerating(true)
    try {
      const res = await api.updateGroup({ regenerateInvite: true })
      if (res.inviteCode) {
        setInviteCode(res.inviteCode)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate link'
      alert(message)
    } finally {
      setIsRegenerating(false)
    }
  }

  const isOwner = currentUser?.role === 'owner' || members.length <= 1

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title={groupName}
        description={`${members.length} ${members.length === 1 ? 'member' : 'members'} · Eastern Time · ${
          isOwner ? 'You are the owner' : 'Member'
        }`}
      />

      <div className="settings-layout">
        <section className="settings-card invite-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon"><Link2 /></span>
            <div>
              <h2>Reusable invite link</h2>
              <p>Send this link to friends so they can join Amioff and submit their days off.</p>
            </div>
          </div>
          <div className="invite-link">
            <code style={{ userSelect: 'all', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullInviteUrl}
            </code>
            <button
              className="button button--primary"
              type="button"
              onClick={handleCopy}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {isOwner && (
            <button
              className="text-button text-button--danger"
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw size={15} />{' '}
              {isRegenerating ? 'Regenerating...' : 'Regenerate and disable the old link'}
            </button>
          )}
        </section>

        <section className="settings-card members-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon"><ShieldCheck /></span>
            <div>
              <h2>Group members ({members.length})</h2>
              <p>Members can see one another’s confirmed availability.</p>
            </div>
          </div>
          <div className="member-list">
            {members.map((member) => (
              <div className="member-row" key={member.id}>
                <span className="avatar" style={{ background: member.color }}>{member.initials}</span>
                <span>
                  <strong>{member.name}</strong>
                  <small>
                    {member.id === currentUser?.id
                      ? `${member.role === 'owner' ? 'Owner · you' : 'You'}`
                      : member.role === 'owner'
                      ? 'Owner'
                      : 'Member'}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
