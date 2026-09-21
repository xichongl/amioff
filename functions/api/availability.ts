import {
  Env,
  GroupAvailabilityMap,
  StoredAvailabilityItem,
  errorResponse,
  getAuthenticatedMember,
  jsonResponse,
} from './_utils'

export interface FlatAvailabilityEntry {
  memberId: string
  date: string
  status: 'full' | 'partial'
  periods: ('morning' | 'afternoon' | 'evening')[]
  source: 'manual' | 'ics' | 'spreadsheet' | 'pdf' | 'image'
}

function flattenMap(map: GroupAvailabilityMap): FlatAvailabilityEntry[] {
  const entries: FlatAvailabilityEntry[] = []
  for (const [date, memberMap] of Object.entries(map)) {
    for (const [memberId, item] of Object.entries(memberMap)) {
      if (item && item.status) {
        entries.push({
          memberId,
          date,
          status: item.status,
          periods: item.periods || [],
          source: item.source || 'manual',
        })
      }
    }
  }
  return entries
}

async function getAvailabilityMap(kv: KVNamespace): Promise<GroupAvailabilityMap> {
  const raw = await kv.get('availability:map')
  if (!raw) return {}
  try {
    return JSON.parse(raw) as GroupAvailabilityMap
  } catch {
    return {}
  }
}

async function saveAvailabilityMap(
  kv: KVNamespace,
  map: GroupAvailabilityMap
): Promise<void> {
  await kv.put('availability:map', JSON.stringify(map))
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const map = await getAvailabilityMap(env.AMIOFF_DATA)
    return jsonResponse({ entries: flattenMap(map) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch availability'
    return errorResponse(message, 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const currentMember = await getAuthenticatedMember(request, env.AMIOFF_DATA)
    if (!currentMember) {
      return errorResponse('Authentication required to update availability.', 401)
    }

    const body = (await request.json()) as {
      date?: string
      status?: 'full' | 'partial' | 'unavailable'
      periods?: ('morning' | 'afternoon' | 'evening')[]
      source?: 'manual' | 'ics' | 'spreadsheet' | 'pdf' | 'image'
      updates?: Array<{
        date: string
        status: 'full' | 'partial' | 'unavailable'
        periods?: ('morning' | 'afternoon' | 'evening')[]
        source?: 'manual' | 'ics' | 'spreadsheet' | 'pdf' | 'image'
      }>
    }

    const map = await getAvailabilityMap(env.AMIOFF_DATA)
    const itemsToApply = body.updates && Array.isArray(body.updates)
      ? body.updates
      : body.date
      ? [{
          date: body.date,
          status: body.status || 'unavailable',
          periods: body.periods || [],
          source: body.source || 'manual',
        }]
      : []

    if (itemsToApply.length === 0) {
      return errorResponse('No availability data provided.')
    }

    for (const update of itemsToApply) {
      const { date, status, periods, source } = update
      if (!date) continue

      if (!map[date]) {
        map[date] = {}
      }

      if (status === 'unavailable' || !status) {
        delete map[date][currentMember.id]
        if (Object.keys(map[date]).length === 0) {
          delete map[date]
        }
      } else {
        const item: StoredAvailabilityItem = {
          status: status === 'full' ? 'full' : 'partial',
          periods: status === 'full' ? ['morning', 'afternoon', 'evening'] : (periods || []),
          source: source || 'manual',
        }
        map[date][currentMember.id] = item
      }
    }

    await saveAvailabilityMap(env.AMIOFF_DATA, map)
    return jsonResponse({
      success: true,
      entries: flattenMap(map),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save availability'
    return errorResponse(message, 500)
  }
}

