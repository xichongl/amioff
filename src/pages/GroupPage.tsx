import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Link2,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { Member } from '../types/domain'

export function GroupPage() {
  const { currentUser, members, groupName, adminAddMember, adminDeleteMember } = useAuth()
  const [inviteCode, setInviteCode] = useState('real-weekend')
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleAddMemberSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)

    const trimmedName = newName.trim()
    const trimmedPin = newPin.trim()

    if (trimmedName.length < 2) {
      setAddError('Name must be at least 2 characters.')
      return
    }
    if (trimmedPin.length < 4) {
      setAddError('Passcode must be at least 4 digits or characters.')
      return
    }

    setIsAdding(true)
    try {
      await adminAddMember(trimmedName, trimmedPin)
      setNewName('')
      setNewPin('')
      setIsAddModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add member'
      setAddError(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteMember = async (member: Member) => {
    const confirmed = confirm(
      `Are you sure you want to remove ${member.name} from the group?\n\nTheir confirmed availability will also be deleted.`
    )
    if (!confirmed) return

    setDeletingId(member.id)
    try {
      await adminDeleteMember(member.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member'
      alert(message)
    } finally {
      setDeletingId(null)
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
          <div
            className="settings-card__heading"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="settings-card__icon"><ShieldCheck /></span>
              <div>
                <h2>Group members ({members.length})</h2>
                <p>Members can see one another’s confirmed availability.</p>
              </div>
            </div>
            {isOwner && (
              <button
                className="button button--secondary"
                type="button"
                style={{ fontSize: '0.82rem', minHeight: '36px', padding: '0.45rem 0.85rem' }}
                onClick={() => {
                  setAddError(null)
                  setNewName('')
                  setNewPin('')
                  setIsAddModalOpen(true)
                }}
              >
                <UserPlus size={15} /> Add Member
              </button>
            )}
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
                {isOwner && member.id !== currentUser?.id && member.role !== 'owner' && (
                  <button
                    type="button"
                    title={`Remove ${member.name} from group`}
                    aria-label={`Remove ${member.name}`}
                    style={{
                      color: 'var(--rose-500)',
                      border: '1px solid #fecdd3',
                      background: '#fff1f2',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      transition: 'all 150ms ease',
                    }}
                    onClick={() => handleDeleteMember(member)}
                    disabled={deletingId === member.id}
                  >
                    <UserMinus size={14} />
                    <span>{deletingId === member.id ? 'Removing...' : 'Remove'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAddModalOpen && (
        <div className="dialog-backdrop" onClick={() => setIsAddModalOpen(false)} role="presentation">
          <div
            className="dialog auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog__header">
              <div>
                <span className="eyebrow">Admin Action</span>
                <h2 id="add-member-title">Add Group Member</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="auth-error">
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="new-member-name">Member Name</label>
                <input
                  id="new-member-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Alex"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
                <span className="form-hint">Display name shown on calendar and reports.</span>
              </div>

              <div className="form-group">
                <label htmlFor="new-member-pin">Passcode / PIN</label>
                <div className="pin-input-wrapper">
                  <span className="pin-icon"><KeyRound size={17} /></span>
                  <input
                    id="new-member-pin"
                    type="password"
                    inputMode="numeric"
                    className="input pin-input"
                    placeholder="4-digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>
                <span className="form-hint">At least 4 digits or characters for their initial sign in.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  style={{ flex: 1 }}
                  disabled={isAdding}
                >
                  {isAdding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
