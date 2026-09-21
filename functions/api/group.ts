import {
  Env,
  errorResponse,
  getAuthenticatedMember,
  getMembers,
  jsonResponse,
} from './_utils'

interface GroupInfo {
  name: string
  timezone: string
  inviteCode: string
}

async function getGroupInfo(kv: KVNamespace): Promise<GroupInfo> {
  const raw = await kv.get('group:info')
  if (!raw) {
    return {
      name: 'Real Weekend',
      timezone: 'America/New_York',
      inviteCode: 'real-weekend',
    }
  }
  try {
    return JSON.parse(raw) as GroupInfo
  } catch {
    return {
      name: 'Real Weekend',
      timezone: 'America/New_York',
      inviteCode: 'real-weekend',
    }
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const info = await getGroupInfo(env.AMIOFF_DATA)
    const members = await getMembers(env.AMIOFF_DATA)
    return jsonResponse({
      ...info,
      membersCount: members.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch group info'
    return errorResponse(message, 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const currentMember = await getAuthenticatedMember(request, env.AMIOFF_DATA)
    if (!currentMember || currentMember.role !== 'owner') {
      return errorResponse('Only the group owner can update group settings.', 403)
    }

    const body = (await request.json()) as {
      name?: string
      timezone?: string
      regenerateInvite?: boolean
    }

    const info = await getGroupInfo(env.AMIOFF_DATA)

    if (body.name && body.name.trim().length >= 2) {
      info.name = body.name.trim()
    }

    if (body.timezone) {
      info.timezone = body.timezone.trim()
    }

    if (body.regenerateInvite) {
      info.inviteCode = `join-${Math.random().toString(36).substring(2, 8)}`
    }

    await env.AMIOFF_DATA.put('group:info', JSON.stringify(info))
    const members = await getMembers(env.AMIOFF_DATA)

    return jsonResponse({
      success: true,
      ...info,
      membersCount: members.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update group settings'
    return errorResponse(message, 500)
  }
}

