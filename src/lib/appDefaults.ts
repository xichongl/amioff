import type { Member } from '../types/domain'

export const defaultGroupName = 'Real Weekend'
export const currentMemberId = 'current-user'

export const initialMembers: Member[] = [
  {
    id: currentMemberId,
    name: 'You',
    initials: 'ME',
    color: '#312e81',
    isCurrentUser: true,
  },
]
