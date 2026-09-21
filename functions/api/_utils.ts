export interface Env {
  AMIOFF_DATA: KVNamespace
}

export interface StoredMember {
  id: string
  name: string
  initials: string
  color: string
  pinHash: string
  role: 'owner' | 'member'
  createdAt: string
}

export interface PublicMember {
  id: string
  name: string
  initials: string
  color: string
  role: 'owner' | 'member'
}

export interface StoredAvailabilityItem {
  status: 'full' | 'partial'
  periods: ('morning' | 'afternoon' | 'evening')[]
  source: 'manual' | 'ics' | 'spreadsheet' | 'pdf' | 'image'
}

export type GroupAvailabilityMap = Record<string, Record<string, StoredAvailabilityItem>>

export interface StoredShortlistItem {
  id: string
  date: string
  title: string
  note?: string
  createdBy: string
  createdAt: string
}

const COLOR_PALETTE = [
  '#4338ca', // Indigo
  '#0369a1', // Ocean Sky
  '#0f766e', // Teal
  '#b45309', // Amber
  '#be123c', // Rose
  '#7e22ce', // Purple
  '#15803d', // Forest Emerald
  '#047857', // Jade
  '#c2410c', // Terracotta
  '#475569', // Slate
]

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...headers,
    },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`amioff_pin_salt_2026_${pin.trim()}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function pickColor(existingCount: number): string {
  return COLOR_PALETTE[existingCount % COLOR_PALETTE.length]
}

export async function getMembers(kv: KVNamespace): Promise<StoredMember[]> {
  const raw = await kv.get('members:list')
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredMember[]
  } catch {
    return []
  }
}

export async function saveMembers(kv: KVNamespace, members: StoredMember[]): Promise<void> {
  await kv.put('members:list', JSON.stringify(members))
}

export function toPublicMember(m: StoredMember): PublicMember {
  return {
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
    role: m.role,
  }
}

export async function getAuthenticatedMember(
  request: Request,
  kv: KVNamespace
): Promise<StoredMember | null> {
  const authHeader = request.headers.get('Authorization')
  let token = ''
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }
  if (!token) {
    const url = new URL(request.url)
    token = url.searchParams.get('token')?.trim() || ''
  }
  if (!token) return null

  const memberId = await kv.get(`session:${token}`)
  if (!memberId) return null

  const members = await getMembers(kv)
  return members.find((m) => m.id === memberId) || null
}

export async function removeMemberAvailability(
  kv: KVNamespace,
  memberId: string
): Promise<void> {
  const raw = await kv.get('availability:map')
  if (!raw) return
  try {
    const map = JSON.parse(raw) as GroupAvailabilityMap
    let changed = false
    for (const date of Object.keys(map)) {
      if (map[date] && map[date][memberId]) {
        delete map[date][memberId]
        changed = true
        if (Object.keys(map[date]).length === 0) {
          delete map[date]
        }
      }
    }
    if (changed) {
      await kv.put('availability:map', JSON.stringify(map))
    }
  } catch {
    // Ignore JSON errors
  }
}

