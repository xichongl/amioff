import {
  Env,
  StoredMember,
  errorResponse,
  generateToken,
  getAuthenticatedMember,
  getInitials,
  getMembers,
  hashPin,
  jsonResponse,
  pickColor,
  removeMemberAvailability,
  saveMembers,
  toPublicMember,
} from './_utils'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const members = await getMembers(env.AMIOFF_DATA)
    const current = await getAuthenticatedMember(request, env.AMIOFF_DATA)

    return jsonResponse({
      members: members.map(toPublicMember),
      currentUser: current ? toPublicMember(current) : null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch auth state'
    return errorResponse(message, 500)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as {
      action?: string
      name?: string
      pin?: string
      memberId?: string
      token?: string
    }

    const action = body.action || 'login'

    if (action === 'register') {
      const rawName = (body.name || '').trim()
      const rawPin = (body.pin || '').trim()

      if (rawName.length < 2 || rawName.length > 40) {
        return errorResponse('Name must be between 2 and 40 characters.')
      }

      if (rawPin.length < 4 || rawPin.length > 20) {
        return errorResponse('Passcode must be at least 4 digits or characters.')
      }

      const members = await getMembers(env.AMIOFF_DATA)
      const existing = members.find(
        (m) => m.name.toLowerCase() === rawName.toLowerCase()
      )
      if (existing) {
        return errorResponse(
          `A member named "${rawName}" already exists. If that is you, please choose "Sign In", or pick a slightly different display name.`
        )
      }

      const pinHash = await hashPin(rawPin)
      const id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const role = members.length === 0 ? 'owner' : 'member'
      const newMember: StoredMember = {
        id,
        name: rawName,
        initials: getInitials(rawName),
        color: pickColor(members.length),
        pinHash,
        role,
        createdAt: new Date().toISOString(),
      }

      const updatedMembers = [...members, newMember]
      await saveMembers(env.AMIOFF_DATA, updatedMembers)

      const token = generateToken()
      // Store session token with 90 day TTL (7776000 seconds)
      await env.AMIOFF_DATA.put(`session:${token}`, id, { expirationTtl: 7776000 })

      return jsonResponse({
        success: true,
        user: toPublicMember(newMember),
        token,
        members: updatedMembers.map(toPublicMember),
      })
    }

    if (action === 'login') {
      const rawPin = (body.pin || '').trim()
      const memberId = (body.memberId || '').trim()
      const rawName = (body.name || '').trim()

      if (!rawPin) {
        return errorResponse('Passcode is required.')
      }

      const members = await getMembers(env.AMIOFF_DATA)
      const target = members.find(
        (m) => m.id === memberId || (rawName && m.name.toLowerCase() === rawName.toLowerCase())
      )

      if (!target) {
        return errorResponse('Member account not found. Please register first.')
      }

      const providedHash = await hashPin(rawPin)
      if (providedHash !== target.pinHash) {
        return errorResponse('Incorrect passcode. Please try again.')
      }

      const token = generateToken()
      await env.AMIOFF_DATA.put(`session:${token}`, target.id, { expirationTtl: 7776000 })

      return jsonResponse({
        success: true,
        user: toPublicMember(target),
        token,
        members: members.map(toPublicMember),
      })
    }

    if (action === 'logout') {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : body.token?.trim()

      if (token) {
        await env.AMIOFF_DATA.delete(`session:${token}`)
      }

      return jsonResponse({ success: true })
    }

    if (action === 'admin_add_member') {
      const caller = await getAuthenticatedMember(request, env.AMIOFF_DATA)
      const members = await getMembers(env.AMIOFF_DATA)
      const isOwner = caller?.role === 'owner' || members.length <= 1
      if (!isOwner) {
        return errorResponse('Only the group owner can add new members directly.', 403)
      }

      const rawName = (body.name || '').trim()
      const rawPin = (body.pin || '').trim()

      if (rawName.length < 2 || rawName.length > 40) {
        return errorResponse('Name must be between 2 and 40 characters.')
      }

      if (rawPin.length < 4 || rawPin.length > 20) {
        return errorResponse('Passcode must be at least 4 digits or characters.')
      }

      const existing = members.find(
        (m) => m.name.toLowerCase() === rawName.toLowerCase()
      )
      if (existing) {
        return errorResponse(`A member named "${rawName}" already exists.`)
      }

      const pinHash = await hashPin(rawPin)
      const id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const newMember: StoredMember = {
        id,
        name: rawName,
        initials: getInitials(rawName),
        color: pickColor(members.length),
        pinHash,
        role: 'member',
        createdAt: new Date().toISOString(),
      }

      const updatedMembers = [...members, newMember]
      await saveMembers(env.AMIOFF_DATA, updatedMembers)

      return jsonResponse({
        success: true,
        member: toPublicMember(newMember),
        members: updatedMembers.map(toPublicMember),
      })
    }

    if (action === 'admin_delete_member') {
      const caller = await getAuthenticatedMember(request, env.AMIOFF_DATA)
      const members = await getMembers(env.AMIOFF_DATA)
      const isOwner = caller?.role === 'owner' || members.length <= 1
      if (!isOwner) {
        return errorResponse('Only the group owner can remove members.', 403)
      }

      const memberIdToDelete = (body.memberId || '').trim()
      if (!memberIdToDelete) {
        return errorResponse('Member ID is required for deletion.')
      }

      if (caller && caller.id === memberIdToDelete) {
        return errorResponse('The group owner cannot delete their own account.', 400)
      }

      const target = members.find((m) => m.id === memberIdToDelete)
      if (!target) {
        return errorResponse('Member not found.', 404)
      }

      if (target.role === 'owner') {
        return errorResponse('Group owner cannot be removed.', 400)
      }

      const remainingMembers = members.filter((m) => m.id !== memberIdToDelete)
      await saveMembers(env.AMIOFF_DATA, remainingMembers)

      await removeMemberAvailability(env.AMIOFF_DATA, memberIdToDelete)

      return jsonResponse({
        success: true,
        deletedMemberId: memberIdToDelete,
        members: remainingMembers.map(toPublicMember),
      })
    }

    return errorResponse(`Unknown action: ${action}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Auth request failed'
    return errorResponse(message, 500)
  }
}

