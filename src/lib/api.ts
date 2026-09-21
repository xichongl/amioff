import type {
  AvailabilityEntry,
  AvailabilityPeriod,
  AvailabilityStatus,
  Member,
  ShortlistItem,
} from '../types/domain'

const TOKEN_KEY = 'amioff_auth_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Ignore localStorage errors in private browsing/sandboxes
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = (data as { error?: string }).error || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data as T
}

export interface AuthStateResponse {
  members: Member[]
  currentUser: Member | null
}

export interface AuthActionResponse {
  success: boolean
  user: Member
  token: string
  members: Member[]
}

export interface GroupInfoResponse {
  name: string
  timezone: string
  inviteCode: string
  membersCount: number
}

export const api = {
  async getAuth(): Promise<AuthStateResponse> {
    return request<AuthStateResponse>('/api/auth')
  },

  async register(name: string, pin: string): Promise<AuthActionResponse> {
    const res = await request<AuthActionResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', name, pin }),
    })
    if (res.token) {
      setStoredToken(res.token)
    }
    return res
  },

  async login(memberId: string, pin: string): Promise<AuthActionResponse> {
    const res = await request<AuthActionResponse>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', memberId, pin }),
    })
    if (res.token) {
      setStoredToken(res.token)
    }
    return res
  },

  async logout(): Promise<void> {
    const token = getStoredToken()
    try {
      await request('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout', token }),
      })
    } finally {
      setStoredToken(null)
    }
  },

  async getAvailability(): Promise<{ entries: AvailabilityEntry[] }> {
    return request<{ entries: AvailabilityEntry[] }>('/api/availability')
  },

  async saveAvailability(params: {
    date: string
    status: AvailabilityStatus | 'unavailable'
    periods?: AvailabilityPeriod[]
    source?: AvailabilityEntry['source']
  }): Promise<{ success: boolean; entries: AvailabilityEntry[] }> {
    return request<{ success: boolean; entries: AvailabilityEntry[] }>('/api/availability', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async getShortlist(): Promise<{ items: ShortlistItem[] }> {
    return request<{ items: ShortlistItem[] }>('/api/shortlist')
  },

  async saveShortlistItem(params: {
    id?: string
    date: string
    title: string
    note?: string
  }): Promise<{ success: boolean; items: ShortlistItem[] }> {
    return request<{ success: boolean; items: ShortlistItem[] }>('/api/shortlist', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async deleteShortlistItem(id: string): Promise<{ success: boolean; items: ShortlistItem[] }> {
    return request<{ success: boolean; items: ShortlistItem[] }>(`/api/shortlist?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  async getGroupInfo(): Promise<GroupInfoResponse> {
    return request<GroupInfoResponse>('/api/group')
  },

  async updateGroup(updates: {
    name?: string
    timezone?: string
    regenerateInvite?: boolean
  }): Promise<{ success: boolean } & GroupInfoResponse> {
    return request<{ success: boolean } & GroupInfoResponse>('/api/group', {
      method: 'POST',
      body: JSON.stringify(updates),
    })
  },
}

