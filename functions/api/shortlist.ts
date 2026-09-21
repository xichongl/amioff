import {
  Env,
  StoredShortlistItem,
  errorResponse,
  getAuthenticatedMember,
  jsonResponse,
} from './_utils'

async function getShortlist(kv: KVNamespace): Promise<StoredShortlistItem[]> {
  const raw = await kv.get('shortlist:items')
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredShortlistItem[]
  } catch {
    return []
  }
}

async function saveShortlist(
  kv: KVNamespace,
  items: StoredShortlistItem[]
): Promise<void> {
  await kv.put('shortlist:items', JSON.stringify(items))
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const items = await getShortlist(env.AMIOFF_DATA)
    return jsonResponse({ items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch shortlist'
    return errorResponse(message, 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const currentMember = await getAuthenticatedMember(request, env.AMIOFF_DATA)
    if (!currentMember) {
      return errorResponse('Authentication required to modify shortlist.', 401)
    }

    const body = (await request.json()) as {
      id?: string
      date: string
      title: string
      note?: string
    }

    if (!body.date || !body.title) {
      return errorResponse('Date and title are required for shortlist items.')
    }

    const items = await getShortlist(env.AMIOFF_DATA)
    const existingIndex = items.findIndex((item) => item.id === body.id)

    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        date: body.date,
        title: body.title.trim(),
        note: body.note ? body.note.trim() : undefined,
      }
    } else {
      const newItem: StoredShortlistItem = {
        id: `sl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: body.date,
        title: body.title.trim(),
        note: body.note ? body.note.trim() : undefined,
        createdBy: currentMember.id,
        createdAt: new Date().toISOString(),
      }
      items.push(newItem)
    }

    await saveShortlist(env.AMIOFF_DATA, items)
    return jsonResponse({ success: true, items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save shortlist item'
    return errorResponse(message, 500)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const currentMember = await getAuthenticatedMember(request, env.AMIOFF_DATA)
    if (!currentMember) {
      return errorResponse('Authentication required to delete shortlist items.', 401)
    }

    const url = new URL(request.url)
    const idFromQuery = url.searchParams.get('id')

    let targetId = idFromQuery
    if (!targetId) {
      try {
        const body = (await request.json()) as { id?: string }
        targetId = body.id
      } catch {
        // Body might be empty
      }
    }

    if (!targetId) {
      return errorResponse('Item ID is required for deletion.')
    }

    let items = await getShortlist(env.AMIOFF_DATA)
    items = items.filter((item) => item.id !== targetId)

    await saveShortlist(env.AMIOFF_DATA, items)
    return jsonResponse({ success: true, items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete shortlist item'
    return errorResponse(message, 500)
  }
}

