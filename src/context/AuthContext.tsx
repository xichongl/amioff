import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, getStoredToken } from '../lib/api'
import { defaultGroupName, initialMembers } from '../lib/appDefaults'
import type { Member } from '../types/domain'

interface AuthContextValue {
  currentUser: Member | null
  members: Member[]
  isLoading: boolean
  isLoggedIn: boolean
  isAuthModalOpen: boolean
  authModalMode: 'register' | 'login'
  groupName: string
  openAuthModal: (mode?: 'register' | 'login') => void
  closeAuthModal: () => void
  register: (name: string, pin: string) => Promise<void>
  login: (memberId: string, pin: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register')
  const [groupName, setGroupName] = useState(defaultGroupName)

  const refreshAuth = useCallback(async () => {
    try {
      const [authData, groupData] = await Promise.allSettled([
        api.getAuth(),
        api.getGroupInfo(),
      ])

      if (authData.status === 'fulfilled') {
        const { members: liveMembers, currentUser: liveCurrent } = authData.value
        if (liveMembers && liveMembers.length > 0) {
          const markedMembers = liveMembers.map((m) => ({
            ...m,
            isCurrentUser: liveCurrent ? m.id === liveCurrent.id : false,
          }))
          setMembers(markedMembers)
        }
        if (liveCurrent) {
          setCurrentUser({ ...liveCurrent, isCurrentUser: true })
        } else {
          setCurrentUser(null)
        }
      }

      if (groupData.status === 'fulfilled' && groupData.value.name) {
        setGroupName(groupData.value.name)
      }
    } catch (err) {
      console.warn('Could not fetch auth state from API, using local state:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const openAuthModal = useCallback((mode: 'register' | 'login' = 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const register = useCallback(async (name: string, pin: string) => {
    const res = await api.register(name, pin)
    const userWithCurrent = { ...res.user, isCurrentUser: true }
    setCurrentUser(userWithCurrent)
    if (res.members) {
      setMembers(
        res.members.map((m) => ({
          ...m,
          isCurrentUser: m.id === res.user.id,
        }))
      )
    }
    setIsAuthModalOpen(false)
  }, [])

  const login = useCallback(async (memberId: string, pin: string) => {
    const res = await api.login(memberId, pin)
    const userWithCurrent = { ...res.user, isCurrentUser: true }
    setCurrentUser(userWithCurrent)
    if (res.members) {
      setMembers(
        res.members.map((m) => ({
          ...m,
          isCurrentUser: m.id === res.user.id,
        }))
      )
    }
    setIsAuthModalOpen(false)
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setCurrentUser(null)
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        isCurrentUser: false,
      }))
    )
  }, [])

  const isLoggedIn = currentUser !== null || getStoredToken() !== null

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        members,
        isLoading,
        isLoggedIn: currentUser !== null,
        isAuthModalOpen,
        authModalMode,
        groupName,
        openAuthModal,
        closeAuthModal,
        register,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

