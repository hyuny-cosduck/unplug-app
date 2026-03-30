import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Group, GroupMember, GroupChallenge, MemberProgress } from '../types'

// Local storage keys (fallback when Supabase not configured)
const GROUP_STORAGE_KEY = 'dd-group'
const MY_MEMBER_KEY = 'dd-my-member-id'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ============================================
// LOCAL STORAGE FUNCTIONS (Fallback)
// ============================================

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ============================================
// SUPABASE TYPES (manual since we don't have generated types)
// ============================================

interface DbGroup {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

interface DbMember {
  id: string
  group_id: string
  name: string
  emoji: string
  user_id: string | null
  joined_at: string
  dti_type: string | null
  username: string | null
}

interface DbChallenge {
  id: string
  group_id: string
  title: string
  description: string
  goal_type: string
  goal_value: number
  start_date: string
  end_date: string
  penalty: string | null
  reward: string | null
  is_active: boolean
  created_at: string
}

interface DbProgress {
  id: string
  member_id: string
  group_id: string
  date: string
  minutes: number
  screenshot_url: string | null
  verified: boolean
  created_at: string
}

// ============================================
// SUPABASE FUNCTIONS
// ============================================

export async function createGroupSupabase(
  groupName: string,
  myName: string,
  myEmoji: string,
  dtiType?: string,
  username?: string
): Promise<{ group: Group; memberId: string } | null> {
  const supabase = getSupabase()
  const code = generateCode()

  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: groupName, code })
    .select()
    .single()

  if (groupError || !group) {
    console.error('Error creating group:', groupError)
    return null
  }

  const dbGroup = group as DbGroup

  // Create member (the creator)
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      group_id: dbGroup.id,
      name: myName,
      emoji: myEmoji,
      dti_type: dtiType,
      username: username?.toLowerCase(),  // Always store lowercase
    })
    .select()
    .single()

  if (memberError || !member) {
    console.error('Error creating member:', memberError)
    return null
  }

  const dbMember = member as DbMember

  // Store member ID locally
  saveLocal(MY_MEMBER_KEY, dbMember.id)

  // Convert to app types
  const appGroup: Group = {
    id: dbGroup.id,
    name: dbGroup.name,
    code: dbGroup.code,
    createdAt: dbGroup.created_at,
    members: [{
      id: dbMember.id,
      name: dbMember.name,
      emoji: dbMember.emoji,
      joinedAt: dbMember.joined_at,
      isMe: true,
    }],
    currentChallenge: undefined,
    challengeHistory: [],
    progress: [],
  }

  return { group: appGroup, memberId: dbMember.id }
}

export async function joinGroupSupabase(
  code: string,
  myName: string,
  myEmoji: string,
  dtiType?: string,
  username?: string
): Promise<{ success: boolean; group?: Group; memberId?: string; error?: string }> {
  const supabase = getSupabase()

  // Find group by code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (groupError || !group) {
    return { success: false, error: 'Invalid invite code' }
  }

  const dbGroup = group as DbGroup

  // Create member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      group_id: dbGroup.id,
      name: myName,
      emoji: myEmoji,
      dti_type: dtiType,
      username: username?.toLowerCase(),  // Always store lowercase
    })
    .select()
    .single()

  if (memberError || !member) {
    console.error('Error joining group:', memberError)
    return { success: false, error: 'Failed to join group' }
  }

  const dbMember = member as DbMember

  // Store member ID locally
  saveLocal(MY_MEMBER_KEY, dbMember.id)

  // Fetch all members
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', dbGroup.id)

  const dbMembers = (members || []) as DbMember[]

  const appGroup: Group = {
    id: dbGroup.id,
    name: dbGroup.name,
    code: dbGroup.code,
    createdAt: dbGroup.created_at,
    members: dbMembers.map(m => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      joinedAt: m.joined_at,
      isMe: m.id === dbMember.id,
    })),
    currentChallenge: undefined,
    challengeHistory: [],
    progress: [],
  }

  return { success: true, group: appGroup, memberId: dbMember.id }
}

export async function fetchGroupSupabase(groupId: string): Promise<Group | null> {
  const supabase = getSupabase()
  const myMemberId = loadLocal<string | null>(MY_MEMBER_KEY, null)

  // Fetch group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) return null

  const dbGroup = group as DbGroup

  // Fetch members
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', groupId)

  const dbMembers = (members || []) as DbMember[]

  // Fetch active challenge
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .limit(1)

  const dbChallenges = (challenges || []) as DbChallenge[]

  // Fetch progress
  const { data: progress } = await supabase
    .from('progress')
    .select('*')
    .eq('group_id', groupId)

  const dbProgress = (progress || []) as DbProgress[]

  const currentChallenge = dbChallenges[0]

  return {
    id: dbGroup.id,
    name: dbGroup.name,
    code: dbGroup.code,
    createdAt: dbGroup.created_at,
    members: dbMembers.map(m => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      joinedAt: m.joined_at,
      isMe: m.id === myMemberId,
    })),
    currentChallenge: currentChallenge ? {
      id: currentChallenge.id,
      title: currentChallenge.title,
      description: currentChallenge.description,
      goalType: currentChallenge.goal_type as GroupChallenge['goalType'],
      goalValue: currentChallenge.goal_value,
      startDate: currentChallenge.start_date,
      endDate: currentChallenge.end_date,
      penalty: currentChallenge.penalty || undefined,
      reward: currentChallenge.reward || undefined,
    } : undefined,
    challengeHistory: [],
    progress: dbProgress.map(p => ({
      memberId: p.member_id,
      date: p.date,
      minutes: p.minutes,
      screenshotUrl: p.screenshot_url || undefined,
      verified: p.verified,
    })),
  }
}

export async function logProgressSupabase(
  groupId: string,
  memberId: string,
  minutes: number,
  screenshotUrl?: string
): Promise<boolean> {
  const supabase = getSupabase()
  const today = new Date().toISOString().split('T')[0]

  // Upsert progress (insert or update if exists)
  const { error } = await supabase
    .from('progress')
    .upsert({
      member_id: memberId,
      group_id: groupId,
      date: today,
      minutes,
      screenshot_url: screenshotUrl,
      verified: !!screenshotUrl,
    }, {
      onConflict: 'member_id,date',
    })

  if (error) {
    console.error('Error logging progress:', error)
    return false
  }

  return true
}

export async function startChallengeSupabase(
  groupId: string,
  challenge: Omit<GroupChallenge, 'id'>
): Promise<GroupChallenge | null> {
  const supabase = getSupabase()

  // Deactivate any existing active challenges
  await supabase
    .from('challenges')
    .update({ is_active: false })
    .eq('group_id', groupId)
    .eq('is_active', true)

  // Create new challenge
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      group_id: groupId,
      title: challenge.title,
      description: challenge.description,
      goal_type: challenge.goalType,
      goal_value: challenge.goalValue,
      start_date: challenge.startDate,
      end_date: challenge.endDate,
      penalty: challenge.penalty,
      reward: challenge.reward,
      is_active: true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Error creating challenge:', error)
    return null
  }

  const dbChallenge = data as DbChallenge

  return {
    id: dbChallenge.id,
    title: dbChallenge.title,
    description: dbChallenge.description,
    goalType: dbChallenge.goal_type as GroupChallenge['goalType'],
    goalValue: dbChallenge.goal_value,
    startDate: dbChallenge.start_date,
    endDate: dbChallenge.end_date,
    penalty: dbChallenge.penalty || undefined,
    reward: dbChallenge.reward || undefined,
  }
}

export async function sendNudgeSupabase(
  groupId: string,
  fromMemberId: string,
  toMemberId: string,
  message?: string
): Promise<boolean> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('nudges')
    .insert({
      group_id: groupId,
      from_member_id: fromMemberId,
      to_member_id: toMemberId,
      message: message || 'Hey, you\'re spending too much time on your phone!',
    })

  if (error) {
    console.error('Error sending nudge:', error)
    return false
  }

  return true
}

export interface Nudge {
  id: string
  fromMemberId: string
  fromMemberName?: string
  fromMemberEmoji?: string
  message: string
  createdAt: string
}

export async function fetchNudgesSupabase(
  memberId: string
): Promise<Nudge[]> {
  const supabase = getSupabase()

  const { data: nudges, error } = await supabase
    .from('nudges')
    .select('*, from_member:members!from_member_id(name, emoji)')
    .eq('to_member_id', memberId)
    .is('read_at', null)  // Use read_at timestamp instead of read boolean
    .order('created_at', { ascending: false })

  if (error || !nudges) {
    console.error('Error fetching nudges:', error)
    return []
  }

  return nudges.map((n: any) => ({
    id: n.id,
    fromMemberId: n.from_member_id,
    fromMemberName: n.from_member?.name,
    fromMemberEmoji: n.from_member?.emoji,
    message: n.message,
    createdAt: n.created_at,
  }))
}

export async function markNudgesReadSupabase(
  nudgeIds: string[]
): Promise<boolean> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('nudges')
    .update({ read_at: new Date().toISOString() })  // Use read_at timestamp
    .in('id', nudgeIds)

  if (error) {
    console.error('Error marking nudges as read:', error)
    return false
  }

  return true
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToGroup(
  groupId: string,
  onUpdate: (group: Group) => void
) {
  const supabase = getSupabase()

  const channel = supabase
    .channel(`group:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        // Refetch group on any member change
        fetchGroupSupabase(groupId).then(group => {
          if (group) onUpdate(group)
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'progress',
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        fetchGroupSupabase(groupId).then(group => {
          if (group) onUpdate(group)
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        fetchGroupSupabase(groupId).then(group => {
          if (group) onUpdate(group)
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================
// FETCH ALL GROUPS FOR A USERNAME
// ============================================

export async function checkUsernameExists(username: string): Promise<boolean> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('members')
    .select('id')
    .ilike('username', username)
    .limit(1)

  if (error) {
    console.error('Error checking username:', error)
    return false
  }

  return (data?.length || 0) > 0
}

export async function fetchGroupsForUsername(username: string): Promise<Group[]> {
  const supabase = getSupabase()

  // Get all members with this username (case-insensitive)
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*, groups(*)')
    .ilike('username', username)

  if (membersError || !members) {
    console.error('Error fetching groups for username:', membersError)
    return []
  }

  // Extract unique groups
  const groupMap = new Map<string, Group>()

  for (const member of members) {
    const dbGroup = (member as any).groups as DbGroup
    if (!dbGroup || groupMap.has(dbGroup.id)) continue

    // Fetch full group data
    const fullGroup = await fetchGroupSupabase(dbGroup.id)
    if (fullGroup) {
      groupMap.set(dbGroup.id, fullGroup)
    }
  }

  return Array.from(groupMap.values())
}

// ============================================
// HYBRID SERVICE (Uses Supabase when available, localStorage otherwise)
// ============================================

export const groupService = {
  isCloudEnabled: isSupabaseConfigured,

  async createGroup(groupName: string, myName: string, myEmoji: string, dtiType?: string, username?: string) {
    if (isSupabaseConfigured) {
      return createGroupSupabase(groupName, myName, myEmoji, dtiType, username)
    }

    // Fallback to localStorage
    const memberId = crypto.randomUUID()
    const group: Group = {
      id: crypto.randomUUID(),
      name: groupName,
      code: generateCode(),
      createdAt: new Date().toISOString(),
      members: [{
        id: memberId,
        name: myName,
        emoji: myEmoji,
        joinedAt: new Date().toISOString(),
        isMe: true,
      }],
      currentChallenge: undefined,
      challengeHistory: [],
      progress: [],
    }

    saveLocal(GROUP_STORAGE_KEY, group)
    saveLocal(MY_MEMBER_KEY, memberId)

    return { group, memberId }
  },

  async joinGroup(code: string, myName: string, myEmoji: string, dtiType?: string, username?: string) {
    if (isSupabaseConfigured) {
      return joinGroupSupabase(code, myName, myEmoji, dtiType, username)
    }

    // Fallback: check local storage
    const localGroup = loadLocal<Group | null>(GROUP_STORAGE_KEY, null)
    if (!localGroup || localGroup.code !== code.toUpperCase()) {
      return { success: false, error: 'Invalid code (local mode)' }
    }

    const memberId = crypto.randomUUID()
    const newMember: GroupMember = {
      id: memberId,
      name: myName,
      emoji: myEmoji,
      joinedAt: new Date().toISOString(),
      isMe: true,
    }

    const updatedGroup = {
      ...localGroup,
      members: [...localGroup.members.map(m => ({ ...m, isMe: false })), newMember],
    }

    saveLocal(GROUP_STORAGE_KEY, updatedGroup)
    saveLocal(MY_MEMBER_KEY, memberId)

    return { success: true, group: updatedGroup, memberId }
  },

  async fetchGroup(groupId: string) {
    if (isSupabaseConfigured) {
      return fetchGroupSupabase(groupId)
    }
    return loadLocal<Group | null>(GROUP_STORAGE_KEY, null)
  },

  async fetchMyGroups(username: string) {
    if (isSupabaseConfigured) {
      return fetchGroupsForUsername(username)
    }
    // Fallback: return single local group if exists
    const group = loadLocal<Group | null>(GROUP_STORAGE_KEY, null)
    return group ? [group] : []
  },

  async checkUsernameExists(username: string) {
    if (isSupabaseConfigured) {
      return checkUsernameExists(username)
    }
    return false
  },

  async logProgress(groupId: string, memberId: string, minutes: number, screenshotUrl?: string) {
    if (isSupabaseConfigured) {
      return logProgressSupabase(groupId, memberId, minutes, screenshotUrl)
    }

    // Fallback to localStorage
    const group = loadLocal<Group | null>(GROUP_STORAGE_KEY, null)
    if (!group) return false

    const today = new Date().toISOString().split('T')[0]
    const newProgress: MemberProgress = {
      memberId,
      date: today,
      minutes,
      screenshotUrl,
      verified: !!screenshotUrl,
    }

    const filteredProgress = group.progress.filter(
      p => !(p.memberId === memberId && p.date === today)
    )

    const updatedGroup = {
      ...group,
      progress: [...filteredProgress, newProgress],
    }

    saveLocal(GROUP_STORAGE_KEY, updatedGroup)
    return true
  },

  subscribe(groupId: string, onUpdate: (group: Group) => void) {
    if (isSupabaseConfigured) {
      return subscribeToGroup(groupId, onUpdate)
    }
    return () => {} // No-op for localStorage
  },

  async sendNudge(groupId: string, fromMemberId: string, toMemberId: string, message?: string) {
    if (isSupabaseConfigured) {
      return sendNudgeSupabase(groupId, fromMemberId, toMemberId, message)
    }
    return false // Not supported in local mode
  },

  async fetchNudges(memberId: string) {
    if (isSupabaseConfigured) {
      return fetchNudgesSupabase(memberId)
    }
    return [] // Not supported in local mode
  },

  async markNudgesRead(nudgeIds: string[]) {
    if (isSupabaseConfigured) {
      return markNudgesReadSupabase(nudgeIds)
    }
    return false // Not supported in local mode
  },

  // Save DTI result (even without group membership)
  async saveDtiResult(dtiType: string, deviceId?: string) {
    if (!isSupabaseConfigured) return false

    try {
      const supabase = getSupabase()

      // Use deviceId or generate anonymous one
      const anonId = deviceId || localStorage.getItem('dd-anon-id') || crypto.randomUUID()
      localStorage.setItem('dd-anon-id', anonId)

      // Upsert to avoid duplicates per device
      const { error } = await supabase
        .from('dti_results')
        .upsert({
          device_id: anonId,
          dti_type: dtiType,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'device_id',
        })

      if (error) {
        console.error('Error saving DTI result:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('Error saving DTI result:', err)
      return false
    }
  },

  // Get DTI stats (for admin)
  async getDtiStats() {
    if (!isSupabaseConfigured) return null

    try {
      const supabase = getSupabase()

      // Total DTI completions
      const { count: totalDti } = await supabase
        .from('dti_results')
        .select('*', { count: 'exact', head: true })

      // Breakdown by type
      const { data: breakdown } = await supabase
        .from('dti_results')
        .select('dti_type')

      const dtiBreakdown: Record<string, number> = {}
      breakdown?.forEach((r: { dti_type: string }) => {
        dtiBreakdown[r.dti_type] = (dtiBreakdown[r.dti_type] || 0) + 1
      })

      return {
        totalDti: totalDti || 0,
        dtiBreakdown,
      }
    } catch (err) {
      console.error('Error getting DTI stats:', err)
      return null
    }
  },
}
