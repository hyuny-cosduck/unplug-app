import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, TrendingDown, TrendingUp, Smile, Target, Sprout, BookOpen, Lightbulb, CheckCircle2, Circle, Minus, Flame, RefreshCw } from 'lucide-react'
import { useUsageStore, useJournalStore, useChallengeStore, useGardenStore } from '../stores/useStore'
import { CHALLENGES } from '../services/challenges'
import { showToast } from '../components/Toast'
import type { Trigger, Mood } from '../types'

// 스트릭 계산 (연속 활동일)
function calculateStreak(
  usageEntries: { date: string }[],
  journalEntries: { timestamp: string }[]
): { current: number; todayDone: boolean } {
  // 날짜별 활동 여부 맵 생성
  const activityDays = new Set<string>()

  usageEntries.forEach(e => {
    activityDays.add(e.date.split('T')[0])
  })
  journalEntries.forEach(e => {
    activityDays.add(e.timestamp.split('T')[0])
  })

  const today = new Date().toISOString().split('T')[0]
  const todayDone = activityDays.has(today)

  // 오늘부터 거슬러 올라가며 연속일 계산
  let streak = 0
  let checkDate = new Date()

  // 오늘 활동이 없으면 어제부터 체크
  if (!todayDone) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (activityDays.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return { current: streak, todayDone }
}

// 마일스톤 체크
function checkMilestones(
  totalEntries: number,
  streak: number,
  completedChallenges: number,
  waterDrops: number
): { key: string; title: string; emoji: string; message: string } | null {
  // 마일스톤 저장소에서 이미 본 마일스톤 확인
  const seenMilestones = JSON.parse(localStorage.getItem('dd-milestones') || '[]') as string[]

  const milestones = [
    { key: 'first-log', condition: totalEntries === 1, title: '첫 기록!', emoji: '🎉', message: '첫 번째 기록을 했어요. 시작이 반이에요!' },
    { key: 'third-log', condition: totalEntries === 3, title: '3개 기록!', emoji: '✨', message: '패턴이 보이기 시작해요. 계속해보세요!' },
    { key: 'tenth-log', condition: totalEntries === 10, title: '10개 기록!', emoji: '🌟', message: '이제 진짜 인사이트를 얻을 준비가 됐어요!' },
    { key: 'streak-3', condition: streak === 3, title: '3일 연속!', emoji: '🔥', message: '습관이 형성되기 시작했어요!' },
    { key: 'streak-7', condition: streak === 7, title: '1주일 연속!', emoji: '💪', message: '대단해요! 이제 습관이 됐어요!' },
    { key: 'first-challenge', condition: completedChallenges === 1, title: '첫 챌린지 완료!', emoji: '🏆', message: '첫 번째 챌린지를 완료했어요!' },
    { key: 'drops-10', condition: waterDrops >= 10 && waterDrops < 11, title: '물방울 10개!', emoji: '💧', message: '정원이 무럭무럭 자랄 거예요!' },
    { key: 'drops-50', condition: waterDrops >= 50 && waterDrops < 51, title: '물방울 50개!', emoji: '🌊', message: '어마어마한 물방울이에요!' },
  ]

  for (const milestone of milestones) {
    if (milestone.condition && !seenMilestones.includes(milestone.key)) {
      return { key: milestone.key, title: milestone.title, emoji: milestone.emoji, message: milestone.message }
    }
  }

  return null
}

function dismissMilestone(key: string) {
  const seenMilestones = JSON.parse(localStorage.getItem('dd-milestones') || '[]') as string[]
  seenMilestones.push(key)
  localStorage.setItem('dd-milestones', JSON.stringify(seenMilestones))
}

// "지금 할 한 가지" 추천
function getOneThingToDo(
  timeMode: 'morning' | 'day' | 'evening' | 'night',
  todayIntention: string | null,
  todayHasLog: boolean,
  todayHasJournal: boolean,
  hasActiveChallenges: boolean,
  streak: number
): { action: string; cta: string; link: string; emoji: string } | null {
  // 아침 + 의도 없음 → 의도 설정
  if (timeMode === 'morning' && !todayIntention) {
    return {
      action: '오늘 SNS 어떻게 쓸지 정해보세요',
      cta: '의도 설정하기',
      link: '#intention',
      emoji: '🎯'
    }
  }

  // 첫 사용자 → 첫 챌린지
  if (!hasActiveChallenges && streak === 0) {
    return {
      action: '가장 쉬운 챌린지 하나 시작해보세요',
      cta: '챌린지 보기',
      link: '/challenges',
      emoji: '🌱'
    }
  }

  // 오늘 기록 없음 + 저녁 → 기록하기
  if (timeMode === 'evening' && !todayHasLog) {
    return {
      action: '오늘 SNS 얼마나 썼나요?',
      cta: '빠르게 기록',
      link: '/log',
      emoji: '📊'
    }
  }

  // 기분 체크 안 함 → 기분 체크
  if (!todayHasJournal) {
    return {
      action: '지금 기분은 어떠세요?',
      cta: '10초 체크인',
      link: '#mood',
      emoji: '💭'
    }
  }

  // 밤 → 내일 의도
  if (timeMode === 'night') {
    return {
      action: '내일을 위해 오늘 잘 마무리하세요',
      cta: '정원 보기',
      link: '/garden',
      emoji: '🌙'
    }
  }

  return null
}

// 오늘의 작은 승리 계산
function getMicroWins(
  entries: { date: string; minutes: number; moodAfter: number }[],
  journals: { timestamp: string }[],
  challenges: { missions: Record<number, boolean> }[],
  streak: number
): { wins: string[]; celebrationEmoji: string } {
  const wins: string[] = []
  const today = new Date().toISOString().split('T')[0]

  // 오늘 기록 확인
  const todayEntries = entries.filter(e => e.date.startsWith(today))
  const todayJournals = journals.filter(j => j.timestamp.startsWith(today))

  if (todayJournals.length > 0) {
    wins.push('감정을 기록했어요')
  }

  if (todayEntries.length > 0) {
    wins.push('SNS 사용을 인식했어요')
    const avgMood = todayEntries.reduce((s, e) => s + e.moodAfter, 0) / todayEntries.length
    if (avgMood >= 4) {
      wins.push('SNS를 기분 좋게 사용했어요')
    }
    const totalMinutes = todayEntries.reduce((s, e) => s + e.minutes, 0)
    if (totalMinutes < 60) {
      wins.push('1시간 이내로 사용했어요')
    }
  }

  // 스트릭 기반
  if (streak >= 3) {
    wins.push(`${streak}일 연속 체크인 중`)
  }

  // 챌린지 미션 완료 확인
  const todayMissionsCompleted = challenges.some(c => {
    const days = Object.entries(c.missions).filter(([_, done]) => done)
    return days.length > 0
  })
  if (todayMissionsCompleted) {
    wins.push('챌린지 미션을 완료했어요')
  }

  // celebration emoji 선택
  let celebrationEmoji = '✨'
  if (wins.length >= 4) celebrationEmoji = '🎉'
  else if (wins.length >= 3) celebrationEmoji = '🌟'
  else if (wins.length >= 2) celebrationEmoji = '💫'

  return { wins, celebrationEmoji }
}

// 스트릭에 따른 메시지 (gentle, non-coercive)
function getStreakMessage(streak: number, todayDone: boolean): { emoji: string; message: string } | null {
  if (streak === 0 && !todayDone) {
    return null // 첫 사용자에겐 스트릭 표시 안함
  }

  if (todayDone) {
    if (streak === 1) return { emoji: '🌱', message: '오늘도 체크인했어요' }
    if (streak < 3) return { emoji: '✨', message: `${streak}일 연속 기록 중` }
    if (streak < 7) return { emoji: '🔥', message: `${streak}일 연속! 좋은 습관이 되어가고 있어요` }
    if (streak < 14) return { emoji: '💪', message: `${streak}일 연속! 대단해요` }
    return { emoji: '🏆', message: `${streak}일 연속! 마스터 레벨이에요` }
  } else {
    // 오늘 아직 안 함 - 부담주지 않는 메시지
    if (streak > 0) {
      return { emoji: '👋', message: `${streak}일 기록 중 · 오늘도 잠깐 들러주세요` }
    }
  }
  return null
}

// 주간 비교 계산
function getWeeklyComparison(entries: { date: string; minutes: number; moodAfter: number }[]) {
  const now = new Date()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(now.getDate() - now.getDay()) // Sunday
  thisWeekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeekEntries = entries.filter((e) => new Date(e.date) >= thisWeekStart)
  const lastWeekEntries = entries.filter(
    (e) => new Date(e.date) >= lastWeekStart && new Date(e.date) < thisWeekStart
  )

  const thisWeekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.minutes, 0)
  const lastWeekMinutes = lastWeekEntries.reduce((sum, e) => sum + e.minutes, 0)

  const thisWeekMood = thisWeekEntries.length
    ? thisWeekEntries.reduce((sum, e) => sum + e.moodAfter, 0) / thisWeekEntries.length
    : 0
  const lastWeekMood = lastWeekEntries.length
    ? lastWeekEntries.reduce((sum, e) => sum + e.moodAfter, 0) / lastWeekEntries.length
    : 0

  return {
    thisWeek: { minutes: thisWeekMinutes, mood: thisWeekMood, entries: thisWeekEntries.length },
    lastWeek: { minutes: lastWeekMinutes, mood: lastWeekMood, entries: lastWeekEntries.length },
    hasLastWeekData: lastWeekEntries.length > 0,
    minutesDiff: lastWeekMinutes > 0 ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100) : 0,
    moodDiff: lastWeekMood > 0 ? thisWeekMood - lastWeekMood : 0,
  }
}

// 오늘의 영감 (시간대 + 날짜 기반)
function getDailyInspiration(timeMode: 'morning' | 'day' | 'evening' | 'night'): string {
  const inspirations = {
    morning: [
      '오늘 하루, 의식적으로 시작해보세요 🌅',
      '작은 선택이 큰 변화를 만들어요',
      '지금 이 순간에 집중해보세요',
      '오늘의 첫 1시간이 하루를 결정해요',
      '핸드폰 없이 아침을 열어보세요',
    ],
    day: [
      '잠깐 멈추고 숨을 쉬어보세요',
      '지금 진짜 필요한 게 SNS일까요?',
      '5분 산책이 30분 스크롤보다 좋아요',
      '오늘도 잘 하고 있어요',
      '작은 휴식이 큰 에너지를 줘요',
    ],
    evening: [
      '오늘 하루 수고했어요',
      '스크린 없이 저녁을 즐겨보세요',
      '내일의 나를 위해 일찍 쉬어보세요',
      '오늘 뭘 했든, 충분해요',
      '따뜻한 차 한 잔 어때요?',
    ],
    night: [
      '푹 자는 게 최고의 디톡스예요',
      '핸드폰은 침대 밖에 두세요',
      '내일 아침의 나를 위해 지금 자요',
      '오늘도 고생 많았어요',
      '꿈꾸는 시간이에요 🌙',
    ],
  }

  const list = inspirations[timeMode]
  const dayIndex = new Date().getDate() % list.length
  return list[dayIndex]
}

// 시간대별 인사말 + 제안 + 모드
function getTimeContext(): { greeting: string; suggestion: string; emoji: string; mode: 'morning' | 'day' | 'evening' | 'night' } {
  const hour = new Date().getHours()

  if (hour < 6) {
    return { greeting: '새벽이네요', suggestion: '잠들기 전 핸드폰 멀리 두기', emoji: '🌙', mode: 'night' }
  }
  if (hour < 10) {
    return { greeting: '좋은 아침이에요', suggestion: '오늘 SNS 어떻게 쓸까요?', emoji: '🌅', mode: 'morning' }
  }
  if (hour < 12) {
    return { greeting: '오전이에요', suggestion: '집중 시간을 지켜보세요', emoji: '☀️', mode: 'day' }
  }
  if (hour < 14) {
    return { greeting: '점심시간이에요', suggestion: '식사할 때 핸드폰 내려놓기', emoji: '🍽️', mode: 'day' }
  }
  if (hour < 18) {
    return { greeting: '오후에요', suggestion: '지금 기분은 어떠세요?', emoji: '🌤️', mode: 'day' }
  }
  if (hour < 21) {
    return { greeting: '저녁이에요', suggestion: '오늘 하루 어땠나요?', emoji: '🌆', mode: 'evening' }
  }
  return { greeting: '밤이에요', suggestion: '내일을 위해 쉬어가세요', emoji: '🌃', mode: 'night' }
}

// 오늘의 의도 저장/불러오기
function getTodayIntention(): string | null {
  const today = new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem('dd-intention')
  if (!stored) return null
  try {
    const { date, intention } = JSON.parse(stored)
    return date === today ? intention : null
  } catch {
    return null
  }
}

function saveTodayIntention(intention: string) {
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem('dd-intention', JSON.stringify({ date: today, intention }))
}

// 간단한 인사이트 생성기
function generateInsight(
  entries: { minutes: number; moodBefore: number; moodAfter: number; trigger: Trigger; app: string }[]
): string | null {
  if (entries.length < 3) return null

  // 사용 후 기분 변화 분석
  const moodChanges = entries.map(e => e.moodAfter - e.moodBefore)
  const avgMoodChange = moodChanges.reduce((a, b) => a + b, 0) / moodChanges.length

  // 앱별 기분 변화
  const appMoodMap: Record<string, number[]> = {}
  entries.forEach(e => {
    if (!appMoodMap[e.app]) appMoodMap[e.app] = []
    appMoodMap[e.app].push(e.moodAfter - e.moodBefore)
  })

  // 가장 기분을 떨어뜨리는 앱
  let worstApp = ''
  let worstChange = 0
  Object.entries(appMoodMap).forEach(([app, changes]) => {
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length
    if (avg < worstChange) {
      worstChange = avg
      worstApp = app
    }
  })

  // 트리거별 분석
  const triggerCount: Record<string, number> = {}
  entries.forEach(e => {
    triggerCount[e.trigger] = (triggerCount[e.trigger] || 0) + 1
  })
  const topTrigger = Object.entries(triggerCount).sort((a, b) => b[1] - a[1])[0]

  // 인사이트 메시지 선택
  if (worstChange < -0.5 && worstApp) {
    const appName = { instagram: '인스타그램', tiktok: '틱톡', youtube: '유튜브', twitter: '트위터', facebook: '페이스북' }[worstApp] || worstApp
    return `💡 ${appName} 사용 후 기분이 떨어지는 패턴이 있어요. 사용 시간을 의식적으로 정해보세요.`
  }

  if (avgMoodChange < -0.3) {
    return '💡 전반적으로 SNS 사용 후 기분이 나빠지는 경향이 있어요. 대안 활동을 시도해보세요.'
  }

  if (topTrigger && topTrigger[0] === 'boredom' && topTrigger[1] >= 3) {
    return '💡 "심심해서" SNS를 여는 경우가 많아요. 심심할 때 할 수 있는 대안 활동 리스트를 만들어보세요.'
  }

  if (topTrigger && topTrigger[0] === 'habit' && topTrigger[1] >= 3) {
    return '💡 습관적으로 SNS를 여는 패턴이 발견됐어요. 앱 아이콘을 폴더 안으로 옮겨보세요.'
  }

  if (avgMoodChange > 0.2) {
    return '🌟 SNS 사용을 잘 관리하고 계시네요! 이 좋은 습관을 유지해보세요.'
  }

  return null
}

const TRIGGER_LABELS: Record<Trigger, string> = {
  boredom: '심심해서',
  habit: '습관적',
  notification: '알림',
  fomo: 'FOMO',
  stress: '스트레스',
  intentional: '의도적',
}

export default function Dashboard() {
  const { entries } = useUsageStore()
  const { entries: journals } = useJournalStore()
  const { progress } = useChallengeStore()
  const { garden } = useGardenStore()

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = entries.filter((e) => e.date.startsWith(today))
    const totalMinutes = todayEntries.reduce((sum, e) => sum + e.minutes, 0)
    const avgMoodAfter = todayEntries.length
      ? todayEntries.reduce((sum, e) => sum + e.moodAfter, 0) / todayEntries.length
      : 0
    const triggers = todayEntries.reduce(
      (acc, e) => {
        acc[e.trigger] = (acc[e.trigger] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const topTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0]

    return {
      totalMinutes,
      avgMoodAfter: avgMoodAfter ? avgMoodAfter.toFixed(1) : '-',
      entryCount: todayEntries.length,
      topTrigger: topTrigger ? TRIGGER_LABELS[topTrigger[0] as Trigger] : '-',
    }
  }, [entries])

  const activeChallenges = progress.filter(
    (p) => Object.keys(p.missions).length < 7
  ).length

  const insight = useMemo(() => generateInsight(entries), [entries])
  const weeklyComparison = useMemo(() => getWeeklyComparison(entries), [entries])

  // 오늘의 목표: 현재 진행 중인 챌린지의 오늘 미션
  const todaysMissions = useMemo(() => {
    return progress
      .map((p) => {
        const challenge = CHALLENGES.find((c) => c.id === p.challengeId)
        if (!challenge) return null
        const currentMission = challenge.dailyMissions.find((m) => m.day === p.currentDay)
        if (!currentMission) return null
        const isCompleted = p.missions[currentMission.day] === true
        return {
          challengeTitle: challenge.title,
          mission: currentMission,
          isCompleted,
          challengeId: challenge.id,
        }
      })
      .filter(Boolean)
  }, [progress])

  const timeContext = getTimeContext()
  const dailyInspiration = getDailyInspiration(timeContext.mode)
  const streak = useMemo(() => calculateStreak(entries, journals), [entries, journals])
  const streakMessage = getStreakMessage(streak.current, streak.todayDone)
  const microWins = useMemo(() => getMicroWins(entries, journals, progress, streak.current), [entries, journals, progress, streak.current])
  const [showQuickMood, setShowQuickMood] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState<false | 'time' | 'feeling'>(false)
  const [quickLogMinutes, setQuickLogMinutes] = useState(60)
  const [todayIntention, setTodayIntention] = useState<string | null>(() => getTodayIntention())
  const [showIntentionPicker, setShowIntentionPicker] = useState(false)

  // "지금 할 한 가지" 계산
  const todayStr = new Date().toISOString().split('T')[0]
  const todayHasLog = entries.some(e => e.date.startsWith(todayStr))
  const todayHasJournal = journals.some(j => j.timestamp.startsWith(todayStr))
  const hasActiveChallenges = progress.length > 0
  const oneThing = useMemo(
    () => getOneThingToDo(timeContext.mode, todayIntention, todayHasLog, todayHasJournal, hasActiveChallenges, streak.current),
    [timeContext.mode, todayIntention, todayHasLog, todayHasJournal, hasActiveChallenges, streak.current]
  )

  const { addEntry: addJournalEntry } = useJournalStore()
  const { addEntry: addUsageEntry } = useUsageStore()

  // 마일스톤 체크
  const completedChallenges = progress.filter(p => Object.keys(p.missions).length >= 7).length
  const [currentMilestone, setCurrentMilestone] = useState(() =>
    checkMilestones(entries.length, streak.current, completedChallenges, garden.waterDrops)
  )

  const handleQuickMood = (mood: Mood) => {
    addJournalEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mood,
      context: 'check-in',
    })
    setShowQuickMood(false)
    showToast('기분을 기록했어요 ✨')
  }

  const handleQuickLog = (minutes: number, feeling: 'good' | 'okay' | 'bad') => {
    const moodMap = { good: 4 as Mood, okay: 3 as Mood, bad: 2 as Mood }
    addUsageEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      app: 'mixed', // 여러 앱 통합
      minutes,
      moodBefore: 3,
      moodAfter: moodMap[feeling],
      trigger: 'habit',
    })
    setShowQuickLog(false)
    showToast(`${minutes}분 기록했어요 📊`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header with time context */}
      <header className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{timeContext.emoji}</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{timeContext.greeting}</p>
            </div>
            {/* Streak badge */}
            {streakMessage && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full">
                <span className="text-sm">{streakMessage.emoji}</span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {streak.current > 0 ? `${streak.current}일` : ''}
                </span>
              </div>
            )}
          </div>
          {/* Streak encouragement message */}
          {streakMessage && streak.current >= 3 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {streakMessage.message}
            </p>
          )}
          {/* Morning: Show intention setter */}
          {timeContext.mode === 'morning' && !todayIntention && !showIntentionPicker && (
            <button
              onClick={() => setShowIntentionPicker(true)}
              className="w-full text-left p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 mb-3"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                🎯 오늘의 의도를 설정해보세요
              </p>
              <p className="text-xs text-gray-500 mt-0.5">탭해서 오늘의 목표 정하기</p>
            </button>
          )}

          {/* Intention picker */}
          {showIntentionPicker && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                오늘 SNS 어떻게 쓸까요?
              </p>
              <div className="space-y-2">
                {[
                  { label: '1시간 이내로 쓰기', emoji: '⏱️' },
                  { label: '점심/저녁 때만 확인하기', emoji: '🍽️' },
                  { label: '필요할 때만 의도적으로', emoji: '🎯' },
                  { label: '오늘은 SNS 없이 보내기', emoji: '🌿' },
                ].map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => {
                      saveTodayIntention(label)
                      setTodayIntention(label)
                      setShowIntentionPicker(false)
                      showToast('오늘의 의도를 설정했어요 💪')
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowIntentionPicker(false)}
                className="w-full text-xs text-gray-400 mt-3"
              >
                나중에 하기
              </button>
            </div>
          )}

          {/* Show current intention */}
          {todayIntention && !showIntentionPicker && (
            <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20 mb-3">
              <span className="text-sm">🎯</span>
              <p className="text-sm text-accent font-medium flex-1">{todayIntention}</p>
              {timeContext.mode === 'evening' && (
                <span className="text-xs text-accent/70">지켰나요?</span>
              )}
            </div>
          )}

          {/* Daily inspiration / Default suggestion */}
          {!showIntentionPicker && !todayIntention && timeContext.mode !== 'morning' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
              "{dailyInspiration}"
            </p>
          )}

          {/* Quick actions */}
          {!showQuickMood && !showQuickLog ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuickMood(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Smile className="w-4 h-4" />
                기분
              </button>
              <button
                onClick={() => setShowQuickLog('time')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Clock className="w-4 h-4" />
                오늘 SNS
              </button>
            </div>
          ) : showQuickMood ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">지금 기분은?</p>
              <div className="flex justify-center gap-2">
                {[
                  { mood: 1 as Mood, emoji: '😞' },
                  { mood: 2 as Mood, emoji: '😔' },
                  { mood: 3 as Mood, emoji: '😐' },
                  { mood: 4 as Mood, emoji: '🙂' },
                  { mood: 5 as Mood, emoji: '😊' },
                ].map(({ mood, emoji }) => (
                  <button
                    key={mood}
                    onClick={() => handleQuickMood(mood)}
                    className="text-2xl p-2 hover:scale-110 transition-transform rounded-lg hover:bg-white dark:hover:bg-gray-600"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowQuickMood(false)}
                className="w-full text-xs text-gray-400 mt-2"
              >
                닫기
              </button>
            </div>
          ) : showQuickLog === 'time' ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">오늘 SNS 얼마나 썼어요?</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { minutes: 30, label: '30분' },
                  { minutes: 60, label: '1시간' },
                  { minutes: 120, label: '2시간' },
                  { minutes: 180, label: '3시간+' },
                ].map(({ minutes, label }) => (
                  <button
                    key={minutes}
                    onClick={() => {
                      setQuickLogMinutes(minutes)
                      setShowQuickLog('feeling')
                    }}
                    className="py-2 px-3 bg-white dark:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowQuickLog(false)}
                className="w-full text-xs text-gray-400 mt-3"
              >
                닫기
              </button>
            </div>
          ) : showQuickLog === 'feeling' ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                {quickLogMinutes >= 60 ? `${quickLogMinutes / 60}시간` : `${quickLogMinutes}분`} 쓴 후 기분은?
              </p>
              <div className="flex justify-center gap-4">
                {[
                  { feeling: 'good' as const, emoji: '😊', label: '좋음' },
                  { feeling: 'okay' as const, emoji: '😐', label: '보통' },
                  { feeling: 'bad' as const, emoji: '😓', label: '별로' },
                ].map(({ feeling, emoji, label }) => (
                  <button
                    key={feeling}
                    onClick={() => handleQuickLog(quickLogMinutes, feeling)}
                    className="flex flex-col items-center p-3 hover:bg-white dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    <span className="text-3xl mb-1">{emoji}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowQuickLog('time')}
                className="w-full text-xs text-gray-400 mt-3"
              >
                ← 시간 다시 선택
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* Milestone Celebration */}
        {currentMilestone && (
          <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-pink-900/30 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-700 text-center animate-pulse">
            <div className="text-5xl mb-3">{currentMilestone.emoji}</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentMilestone.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {currentMilestone.message}
            </p>
            <button
              onClick={() => {
                dismissMilestone(currentMilestone.key)
                setCurrentMilestone(null)
              }}
              className="px-6 py-2 bg-white dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow transition-shadow"
            >
              멋져요! 🎊
            </button>
          </div>
        )}

        {/* One Thing To Do - prominent CTA */}
        {oneThing && oneThing.link !== '#intention' && oneThing.link !== '#mood' && (
          <Link
            to={oneThing.link}
            className="block bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                {oneThing.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-90">{oneThing.action}</p>
                <p className="text-lg font-bold">{oneThing.cta} →</p>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="w-5 h-5 text-primary" />}
            label="오늘 사용"
            value={`${todayStats.totalMinutes}분`}
          />
          <StatCard
            icon={<Smile className="w-5 h-5 text-warning" />}
            label="평균 기분"
            value={todayStats.avgMoodAfter.toString()}
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-accent" />}
            label="주요 트리거"
            value={todayStats.topTrigger}
          />
          <StatCard
            icon={<Sprout className="w-5 h-5 text-garden-green" />}
            label="물방울"
            value={`${garden.waterDrops}💧`}
          />
        </div>

        {/* Micro Wins - today's small victories */}
        {microWins.wins.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{microWins.celebrationEmoji}</span>
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                오늘의 작은 승리
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {microWins.wins.map((win, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/60 dark:bg-gray-700/60 rounded-full text-xs text-emerald-700 dark:text-emerald-300"
                >
                  ✓ {win}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Progress - only show if we have data to compare */}
        {entries.length >= 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              이번 주 vs 지난 주
            </h3>

            {weeklyComparison.hasLastWeekData ? (
              <div className="grid grid-cols-2 gap-4">
                {/* SNS Time */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {weeklyComparison.minutesDiff < 0 ? (
                      <TrendingDown className="w-4 h-4 text-accent" />
                    ) : weeklyComparison.minutesDiff > 0 ? (
                      <TrendingUp className="w-4 h-4 text-danger" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-lg font-bold ${
                      weeklyComparison.minutesDiff < 0 ? 'text-accent' :
                      weeklyComparison.minutesDiff > 0 ? 'text-danger' : 'text-gray-500'
                    }`}>
                      {weeklyComparison.minutesDiff > 0 ? '+' : ''}{weeklyComparison.minutesDiff}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">SNS 사용</p>
                  <p className="text-xs text-gray-400">
                    {weeklyComparison.thisWeek.minutes}분 vs {weeklyComparison.lastWeek.minutes}분
                  </p>
                </div>

                {/* Mood */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {weeklyComparison.moodDiff > 0.2 ? (
                      <TrendingUp className="w-4 h-4 text-accent" />
                    ) : weeklyComparison.moodDiff < -0.2 ? (
                      <TrendingDown className="w-4 h-4 text-danger" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-lg font-bold ${
                      weeklyComparison.moodDiff > 0.2 ? 'text-accent' :
                      weeklyComparison.moodDiff < -0.2 ? 'text-danger' : 'text-gray-500'
                    }`}>
                      {weeklyComparison.moodDiff > 0 ? '+' : ''}{weeklyComparison.moodDiff.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">평균 기분</p>
                  <p className="text-xs text-gray-400">
                    {weeklyComparison.thisWeek.mood.toFixed(1)} vs {weeklyComparison.lastWeek.mood.toFixed(1)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {weeklyComparison.thisWeek.entries}개 기록 중
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  다음 주에 비교할 수 있어요
                </p>
              </div>
            )}
          </div>
        )}

        {/* Today's Goals */}
        {todaysMissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">오늘의 목표</h3>
            </div>
            <div className="space-y-2">
              {todaysMissions.map((item) => item && (
                <Link
                  key={item.challengeId}
                  to="/challenges"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      item.isCompleted
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.mission.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.challengeTitle} · Day {item.mission.day}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight */}
        {insight && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight}</p>
            </div>
          </div>
        )}

        {/* Time Conversion */}
        {garden.totalTimeSaved > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              절약한 시간 <span className="font-bold text-primary">{garden.totalTimeSaved}분</span>으로...
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              📚 책 {Math.floor(garden.totalTimeSaved / 30)}권 읽기 가능 ·
              🏃 {Math.floor(garden.totalTimeSaved / 20)}km 달리기 가능
            </p>
          </div>
        )}

        {/* Future Self Prompt - shows when user hasn't logged today yet */}
        {entries.length > 0 && !entries.some(e => e.date.startsWith(new Date().toISOString().split('T')[0])) && (
          <FutureSelfPrompt />
        )}

        {/* First-time User Guide */}
        {entries.length === 0 && progress.length === 0 && (
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/20">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                첫 번째 미션
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                딱 하나만 해보세요. 1분이면 돼요.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/challenges"
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl">
                  🌱
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    첫 챌린지 시작하기
                  </p>
                  <p className="text-xs text-gray-500">가장 쉬운 것부터 · 씨앗도 심어져요</p>
                </div>
                <span className="text-primary text-sm font-medium">추천</span>
              </Link>

              <Link
                to="/log"
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl">
                  📝
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    오늘 SNS 사용 기록하기
                  </p>
                  <p className="text-xs text-gray-500">방금 SNS 봤다면 · 30초면 끝</p>
                </div>
              </Link>

              <Link
                to="/journal"
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-xl">
                  💭
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    지금 기분 기록하기
                  </p>
                  <p className="text-xs text-gray-500">2탭이면 끝 · 감정 패턴 발견</p>
                </div>
              </Link>
            </div>

            <p className="text-xs text-center text-gray-400 mt-4">
              어떤 것을 먼저 해도 좋아요 ✨
            </p>
          </div>
        )}

        {/* Empty State - has some activity but no entries */}
        {entries.length === 0 && progress.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              사용 기록을 시작해보세요
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              SNS 사용 패턴을 파악하면 인사이트를 받을 수 있어요
            </p>
            <Link
              to="/log"
              className="inline-block px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium"
            >
              사용 기록하기
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            빠른 실행
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/log" icon={<Clock className="w-5 h-5" />} label="사용 기록" />
            <QuickAction to="/journal" icon={<BookOpen className="w-5 h-5" />} label="감정 기록" />
            <QuickAction to="/challenges" icon={<Target className="w-5 h-5" />} label={`챌린지 (${activeChallenges})`} />
            <QuickAction to="/garden" icon={<Sprout className="w-5 h-5" />} label="나의 정원" />
            <QuickAction to="/onboarding" icon={<RefreshCw className="w-5 h-5" />} label="DTI 다시하기" />
          </div>
        </div>

        {/* Recent Journal */}
        {journals.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              최근 감정
            </h2>
            <div className="space-y-2">
              {journals.slice(0, 3).map((j) => (
                <div
                  key={j.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-gray-700"
                >
                  <span className="text-2xl">{moodEmoji(j.mood)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {j.note || contextLabel(j.context)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(j.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-colors"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </Link>
  )
}

function FutureSelfPrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  if (dismissed) return null

  const prompts = [
    { question: '지금 SNS를 30분 본다면, 그 후의 나는?', options: ['더 행복', '비슷함', '더 피곤'] },
    { question: '지금 하고 싶은 건 정말 SNS인가요?', options: ['네', '사실은 쉬고 싶어요', '그냥 심심해서'] },
    { question: '30분 후, 뭘 했으면 좋겠어요?', options: ['SNS 봤기', '산책했기', '책 읽었기'] },
  ]

  // 랜덤 프롬프트 (매일 같은 것)
  const today = new Date().getDate()
  const prompt = prompts[today % prompts.length]

  if (selectedAnswer) {
    const isReflective = selectedAnswer !== '더 행복' && selectedAnswer !== '네' && selectedAnswer !== 'SNS 봤기'
    return (
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-violet-200 dark:border-violet-700">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {isReflective ? (
            <>🌟 좋은 자기인식이에요. 지금 진짜 원하는 걸 해보세요.</>
          ) : (
            <>👌 괜찮아요! 의식적으로 사용한다면 SNS도 괜찮아요.</>
          )}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-violet-500 mt-2"
        >
          닫기
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-violet-200 dark:border-violet-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        🔮 {prompt.question}
      </p>
      <div className="flex gap-2 flex-wrap">
        {prompt.options.map((option) => (
          <button
            key={option}
            onClick={() => setSelectedAnswer(option)}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-gray-400 mt-3 block"
      >
        건너뛰기
      </button>
    </div>
  )
}

function moodEmoji(mood: number) {
  return ['', '😞', '😔', '😐', '🙂', '😊'][mood] || '😐'
}

function contextLabel(ctx: string) {
  return { 'pre-sns': 'SNS 사용 전', 'post-sns': 'SNS 사용 후', 'check-in': '기분 체크인' }[ctx] || ctx
}
