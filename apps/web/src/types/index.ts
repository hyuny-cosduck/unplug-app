export interface UsageEntry {
  id: string
  date: string // ISO date
  app: string // e.g. "instagram", "tiktok", "youtube"
  minutes: number
  moodBefore: Mood
  moodAfter: Mood
  trigger: Trigger
  note?: string
}

export type Mood = 1 | 2 | 3 | 4 | 5 // 1=very bad, 5=very good

export type Trigger =
  | 'boredom'
  | 'habit'
  | 'notification'
  | 'fomo'
  | 'stress'
  | 'intentional'

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  durationDays: number
  dailyMissions: DailyMission[]
  category: 'awareness' | 'reduction' | 'replacement' | 'mindfulness'
}

export interface DailyMission {
  day: number
  title: string
  description: string
  completed: boolean
}

export interface ChallengeProgress {
  challengeId: string
  startDate: string
  currentDay: number
  streak: number
  missedDays: number
  missions: Record<number, boolean> // day -> completed
}

export interface JournalEntry {
  id: string
  timestamp: string
  mood: Mood
  context: 'pre-sns' | 'post-sns' | 'check-in'
  note?: string
}

export interface Plant {
  id: string
  name: string
  type: 'flower' | 'tree' | 'herb'
  stage: number // 0-5 growth stages
  health: number // 0-100
  waterLevel: number // 0-100
  sunlight: number // 0-100
  plantedDate: string
  emoji: string
}

export interface GardenState {
  plants: Plant[]
  totalTimeSaved: number // minutes
  waterDrops: number // earned from saved time
}

export interface WeeklyStats {
  totalMinutes: number
  avgMood: number
  topApp: string
  topTrigger: Trigger
  timeSavedVsLastWeek: number
  challengesCompleted: number
}

// Group-based types (from report v2)
export interface GroupMember {
  id: string
  name: string
  emoji: string // avatar emoji
  joinedAt: string
  isMe: boolean
}

export interface GroupChallenge {
  id: string
  title: string
  description: string
  goalType: 'reduce_percent' | 'max_hours' | 'no_sns_hours'
  goalValue: number // e.g., 50 for 50% reduction, 2 for max 2 hours
  startDate: string
  endDate: string
  penalty?: string // e.g., "buy coffee"
  reward?: string
}

export interface MemberProgress {
  memberId: string
  date: string
  minutes: number
  screenshotUrl?: string // base64 or URL
  verified: boolean
}

export interface Group {
  id: string
  name: string
  code: string // invite code
  createdAt: string
  members: GroupMember[]
  currentChallenge?: GroupChallenge
  challengeHistory: GroupChallenge[]
  progress: MemberProgress[]
}

export interface GroupState {
  myGroup: Group | null
  myMemberId: string | null
}
