import { useState, type FormEvent } from 'react'
import { KeyRound, LogIn, UserPlus, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    members,
    register,
    login,
  } = useAuth()

  const [mode, setMode] = useState<'register' | 'login'>(authModalMode)
  const [name, setName] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState(
    members.length > 0 ? members[0].id : ''
  )
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthModalOpen) return null

  const handleModeChange = (newMode: 'register' | 'login') => {
    setMode(newMode)
    setError(null)
    setPin('')
    if (newMode === 'login' && members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your name.')
          setIsSubmitting(false)
          return
        }
        if (pin.trim().length < 4) {
          setError('Please enter a passcode of at least 4 digits.')
          setIsSubmitting(false)
          return
        }
        await register(name.trim(), pin.trim())
      } else {
        if (!selectedMemberId) {
          setError('Please select your name.')
          setIsSubmitting(false)
          return
        }
        if (!pin.trim()) {
          setError('Please enter your passcode.')
          setIsSubmitting(false)
          return
        }
        await login(selectedMemberId, pin.trim())
      }
      setPin('')
      setName('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={closeAuthModal} role="presentation">
      <div
        className="dialog auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog__header">
          <div>
            <span className="eyebrow">Group Account</span>
            <h2 id="auth-dialog-title">
              {mode === 'register' ? 'Join the group' : 'Welcome back'}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={closeAuthModal}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => handleModeChange('register')}
          >
            <UserPlus size={16} /> I&apos;m New
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => handleModeChange('login')}
            disabled={members.length === 0}
          >
            <LogIn size={16} /> Sign In
          </button>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' ? (
            <>
              <div className="form-group">
                <label htmlFor="reg-name">Your Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Alex Liu or Dr. Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                  maxLength={40}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-pin">
                  Create a 4-digit Passcode / PIN
                </label>
                <div className="pin-input-wrapper">
                  <KeyRound size={17} className="pin-icon" />
                  <input
                    id="reg-pin"
                    type="password"
                    inputMode="numeric"
                    className="input pin-input"
                    placeholder="e.g. 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    minLength={4}
                    maxLength={20}
                  />
                </div>
                <small className="form-hint">
                  Use this PIN whenever you log in from a new phone or computer.
                </small>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="login-member">Select Your Name</label>
                <select
                  id="login-member"
                  className="input select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  autoFocus
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.role === 'owner' ? '(Owner)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="login-pin">Enter Your Passcode / PIN</label>
                <div className="pin-input-wrapper">
                  <KeyRound size={17} className="pin-icon" />
                  <input
                    id="login-pin"
                    type="password"
                    inputMode="numeric"
                    className="input pin-input"
                    placeholder="4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="dialog__actions">
            <button
              className="button button--quiet"
              type="button"
              onClick={closeAuthModal}
            >
              Cancel
            </button>
            <button
              className="button button--primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Connecting...'
                : mode === 'register'
                ? 'Join Group'
                : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

