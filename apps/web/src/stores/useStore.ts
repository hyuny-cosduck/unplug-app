import { useState, useCallback } from 'react'
import type {
  UsageEntry,
  JournalEntry,
  ChallengeProgress,
  GardenState,
  Plant,
  Group,
  GroupMember,
  GroupChallenge,
  MemberProgress,
} from '../types'

const STORAGE_KEYS = {
  usage: 'dd-usage',
  journal: 'dd-journal',
  challenges: 'dd-challenges',
  garden: 'dd-garden',
  onboarded: 'dd-onboarded',
} as const

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

const DEFAULT_PLANTS: Plant[] = [
  {
    id: 'sunflower-1',
    name: '희망의 해바라기',
    type: 'flower',
    stage: 0,
    health: 50,
    waterLevel: 50,
    sunlight: 50,
    plantedDate: new Date().toISOString(),
    emoji: '🌻',
  },
]

const DEFAULT_GARDEN: GardenState = {
  plants: DEFAULT_PLANTS,
  totalTimeSaved: 0,
  waterDrops: 0,
}

export function useUsageStore() {
  const [entries, setEntries] = useState<UsageEntry[]>(() =>
    load(STORAGE_KEYS.usage, [])
  )

  const addEntry = useCallback((entry: UsageEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev]
      save(STORAGE_KEYS.usage, next)
      return next
    })
  }, [])

  return { entries, addEntry }
}

export function useJournalStore() {
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    load(STORAGE_KEYS.journal, [])
  )

  const addEntry = useCallback((entry: JournalEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev]
      save(STORAGE_KEYS.journal, next)
      return next
    })
  }, [])

  return { entries, addEntry }
}

export function useChallengeStore() {
  const [progress, setProgress] = useState<ChallengeProgress[]>(() =>
    load(STORAGE_KEYS.challenges, [])
  )

  const startChallenge = useCallback((challengeId: string) => {
    setProgress((prev) => {
      const next = [
        ...prev,
        {
          challengeId,
          startDate: new Date().toISOString(),
          currentDay: 1,
          streak: 0,
          missedDays: 0,
          missions: {},
        },
      ]
      save(STORAGE_KEYS.challenges, next)
      return next
    })
  }, [])

  const completeMission = useCallback((challengeId: string, day: number) => {
    setProgress((prev) => {
      const next = prev.map((p) =>
        p.challengeId === challengeId
          ? { ...p, missions: { ...p.missions, [day]: true }, streak: p.streak + 1, currentDay: Math.max(p.currentDay, day + 1) }
          : p
      )
      save(STORAGE_KEYS.challenges, next)
      return next
    })
  }, [])

  return { progress, startChallenge, completeMission }
}

// 챌린지 완료 시 정원 보상 지급 훅
export function useRewardedChallengeStore() {
  const challengeStore = useChallengeStore()
  const { addWaterDrops, addPlant, garden, upgradePlant } = useGardenStore()

  // 챌린지 시작 시 씨앗 심기
  const startChallengeWithSeed = useCallback((
    challengeId: string,
    seed?: Omit<Plant, 'id' | 'plantedDate'>
  ) => {
    challengeStore.startChallenge(challengeId)
    if (seed) {
      // 이미 같은 이름의 씨앗/식물이 있는지 확인
      const alreadyHas = garden.plants.some(p => p.name === seed.name)
      if (!alreadyHas) {
        addPlant(seed)
        return { seedPlanted: true, seedName: seed.name }
      }
    }
    return { seedPlanted: false }
  }, [challengeStore, addPlant, garden.plants])

  const completeMissionWithReward = useCallback((
    challengeId: string,
    day: number,
    totalDays: number,
    seedName?: string,
    rewardPlant?: Omit<Plant, 'id' | 'plantedDate'>
  ) => {
    challengeStore.completeMission(challengeId, day)
    addWaterDrops(3) // 미션 완료당 물방울 3개

    // 챌린지 완료 체크 (마지막 미션 완료 시)
    if (day === totalDays && rewardPlant && seedName) {
      // 씨앗을 완성된 식물로 업그레이드
      upgradePlant(seedName, rewardPlant)
      return { challengeCompleted: true, plantName: rewardPlant.name }
    }
    return { challengeCompleted: false }
  }, [challengeStore, addWaterDrops, upgradePlant])

  return {
    ...challengeStore,
    startChallengeWithSeed,
    completeMissionWithReward,
  }
}

export function useGardenStore() {
  const [garden, setGarden] = useState<GardenState>(() =>
    load(STORAGE_KEYS.garden, DEFAULT_GARDEN)
  )

  const waterPlant = useCallback((plantId: string) => {
    setGarden((prev) => {
      const next = {
        ...prev,
        plants: prev.plants.map((p) =>
          p.id === plantId
            ? {
                ...p,
                waterLevel: Math.min(100, p.waterLevel + 20),
                stage: p.waterLevel > 80 ? Math.min(5, p.stage + 1) : p.stage,
              }
            : p
        ),
        waterDrops: Math.max(0, prev.waterDrops - 1),
      }
      save(STORAGE_KEYS.garden, next)
      return next
    })
  }, [])

  const addTimeSaved = useCallback((minutes: number) => {
    setGarden((prev) => {
      const drops = Math.floor(minutes / 10) // 10분당 물방울 1개
      const next = {
        ...prev,
        totalTimeSaved: prev.totalTimeSaved + minutes,
        waterDrops: prev.waterDrops + drops,
      }
      save(STORAGE_KEYS.garden, next)
      return next
    })
  }, [])

  const addWaterDrops = useCallback((drops: number) => {
    setGarden((prev) => {
      const next = {
        ...prev,
        waterDrops: prev.waterDrops + drops,
      }
      save(STORAGE_KEYS.garden, next)
      return next
    })
  }, [])

  const addPlant = useCallback((plant: Omit<Plant, 'id' | 'plantedDate'>) => {
    setGarden((prev) => {
      const newPlant: Plant = {
        ...plant,
        id: crypto.randomUUID(),
        plantedDate: new Date().toISOString(),
      }
      const next = {
        ...prev,
        plants: [...prev.plants, newPlant],
      }
      save(STORAGE_KEYS.garden, next)
      return next
    })
  }, [])

  // 씨앗을 완성된 식물로 업그레이드
  const upgradePlant = useCallback((seedName: string, upgradedPlant: Omit<Plant, 'id' | 'plantedDate'>) => {
    setGarden((prev) => {
      const next = {
        ...prev,
        plants: prev.plants.map((p) =>
          p.name === seedName
            ? { ...p, ...upgradedPlant }
            : p
        ),
      }
      save(STORAGE_KEYS.garden, next)
      return next
    })
  }, [])

  return { garden, waterPlant, addTimeSaved, addWaterDrops, addPlant, upgradePlant }
}

export function useOnboarding() {
  const [onboarded, setOnboarded] = useState(() =>
    load(STORAGE_KEYS.onboarded, false)
  )

  const completeOnboarding = useCallback(() => {
    setOnboarded(true)
    save(STORAGE_KEYS.onboarded, true)
  }, [])

  return { onboarded, completeOnboarding }
}

// Group store - core feature from report v2
const GROUP_STORAGE_KEY = 'dd-group'
const MY_MEMBER_KEY = 'dd-my-member-id'

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function useGroupStore() {
  const [group, setGroup] = useState<Group | null>(() =>
    load(GROUP_STORAGE_KEY, null)
  )
  const [myMemberId, setMyMemberId] = useState<string | null>(() =>
    load(MY_MEMBER_KEY, null)
  )

  // Create a new group
  const createGroup = useCallback((groupName: string, myName: string, myEmoji: string) => {
    const memberId = crypto.randomUUID()
    const newGroup: Group = {
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
    setGroup(newGroup)
    setMyMemberId(memberId)
    save(GROUP_STORAGE_KEY, newGroup)
    save(MY_MEMBER_KEY, memberId)
    return newGroup
  }, [])

  // Join existing group (simulated - in real app would be server-based)
  const joinGroup = useCallback((code: string, myName: string, myEmoji: string) => {
    // For MVP, we simulate joining by adding member to local group
    // In production, this would be a server call
    if (!group || group.code !== code) {
      return { success: false, error: 'Invalid code' }
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
      ...group,
      members: [...group.members.map(m => ({ ...m, isMe: false })), newMember],
    }
    setGroup(updatedGroup)
    setMyMemberId(memberId)
    save(GROUP_STORAGE_KEY, updatedGroup)
    save(MY_MEMBER_KEY, memberId)
    return { success: true }
  }, [group])

  // Add a friend (for demo/testing)
  const addFriend = useCallback((name: string, emoji: string) => {
    if (!group) return
    const newMember: GroupMember = {
      id: crypto.randomUUID(),
      name,
      emoji,
      joinedAt: new Date().toISOString(),
      isMe: false,
    }
    const updatedGroup = {
      ...group,
      members: [...group.members, newMember],
    }
    setGroup(updatedGroup)
    save(GROUP_STORAGE_KEY, updatedGroup)
  }, [group])

  // Start a group challenge
  const startChallenge = useCallback((challenge: Omit<GroupChallenge, 'id'>) => {
    if (!group) return
    const newChallenge: GroupChallenge = {
      ...challenge,
      id: crypto.randomUUID(),
    }
    const updatedGroup = {
      ...group,
      currentChallenge: newChallenge,
    }
    setGroup(updatedGroup)
    save(GROUP_STORAGE_KEY, updatedGroup)
  }, [group])

  // Log daily progress (screen time)
  const logProgress = useCallback((minutes: number, screenshotUrl?: string) => {
    if (!group || !myMemberId) return
    const today = new Date().toISOString().split('T')[0]
    const newProgress: MemberProgress = {
      memberId: myMemberId,
      date: today,
      minutes,
      screenshotUrl,
      verified: !!screenshotUrl,
    }
    // Remove existing entry for today if exists
    const filteredProgress = group.progress.filter(
      p => !(p.memberId === myMemberId && p.date === today)
    )
    const updatedGroup = {
      ...group,
      progress: [...filteredProgress, newProgress],
    }
    setGroup(updatedGroup)
    save(GROUP_STORAGE_KEY, updatedGroup)
  }, [group, myMemberId])

  // Simulate friend's progress (for demo)
  const addFriendProgress = useCallback((memberId: string, minutes: number) => {
    if (!group) return
    const today = new Date().toISOString().split('T')[0]
    const newProgress: MemberProgress = {
      memberId,
      date: today,
      minutes,
      verified: true,
    }
    const filteredProgress = group.progress.filter(
      p => !(p.memberId === memberId && p.date === today)
    )
    const updatedGroup = {
      ...group,
      progress: [...filteredProgress, newProgress],
    }
    setGroup(updatedGroup)
    save(GROUP_STORAGE_KEY, updatedGroup)
  }, [group])

  // Get leaderboard for today
  const getTodayLeaderboard = useCallback(() => {
    if (!group) return []
    const today = new Date().toISOString().split('T')[0]
    const todayProgress = group.progress.filter(p => p.date === today)

    return group.members.map(member => {
      const progress = todayProgress.find(p => p.memberId === member.id)
      return {
        member,
        minutes: progress?.minutes ?? null,
        verified: progress?.verified ?? false,
      }
    }).sort((a, b) => {
      if (a.minutes === null) return 1
      if (b.minutes === null) return -1
      return a.minutes - b.minutes // Lower is better
    })
  }, [group])

  // Get weekly stats per member
  const getWeeklyStats = useCallback(() => {
    if (!group) return []
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekProgress = group.progress.filter(
      p => new Date(p.date) >= weekStart
    )

    return group.members.map(member => {
      const memberProgress = weekProgress.filter(p => p.memberId === member.id)
      const totalMinutes = memberProgress.reduce((sum, p) => sum + p.minutes, 0)
      const daysLogged = memberProgress.length
      return {
        member,
        totalMinutes,
        daysLogged,
        avgMinutes: daysLogged > 0 ? Math.round(totalMinutes / daysLogged) : 0,
      }
    }).sort((a, b) => a.totalMinutes - b.totalMinutes)
  }, [group])

  // Check if can start (need 2+ members)
  const canStart = group ? group.members.length >= 2 : false

  // Leave group
  const leaveGroup = useCallback(() => {
    setGroup(null)
    setMyMemberId(null)
    localStorage.removeItem(GROUP_STORAGE_KEY)
    localStorage.removeItem(MY_MEMBER_KEY)
  }, [])

  return {
    group,
    myMemberId,
    canStart,
    createGroup,
    joinGroup,
    addFriend,
    startChallenge,
    logProgress,
    addFriendProgress,
    getTodayLeaderboard,
    getWeeklyStats,
    leaveGroup,
  }
}
