import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, ArrowRight } from 'lucide-react'
import { useUsageStore, useGardenStore } from '../stores/useStore'
import { getRecommendedActivities, type Activity } from '../services/activities'
import type { Mood, Trigger } from '../types'

const APPS = [
  { id: 'instagram', label: '인스타그램', emoji: '📸' },
  { id: 'tiktok', label: '틱톡', emoji: '🎵' },
  { id: 'youtube', label: '유튜브', emoji: '▶️' },
  { id: 'twitter', label: 'X (트위터)', emoji: '🐦' },
  { id: 'facebook', label: '페이스북', emoji: '👤' },
  { id: 'other', label: '기타', emoji: '📱' },
]

const TRIGGERS: { id: Trigger; label: string; emoji: string }[] = [
  { id: 'boredom', label: '심심해서', emoji: '😶' },
  { id: 'habit', label: '습관적으로', emoji: '🔄' },
  { id: 'notification', label: '알림이 와서', emoji: '🔔' },
  { id: 'fomo', label: '놓칠까봐', emoji: '👀' },
  { id: 'stress', label: '스트레스', emoji: '😰' },
  { id: 'intentional', label: '의도적으로', emoji: '🎯' },
]

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: '매우 나쁨' },
  { value: 2, emoji: '😔', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
]

export default function UsageLog() {
  const navigate = useNavigate()
  const { addEntry } = useUsageStore()
  const { addTimeSaved } = useGardenStore()

  const [step, setStep] = useState(0) // 0: app, 1: time, 2: trigger, 3: mood before, 4: mood after, 5: alternatives
  const [app, setApp] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [trigger, setTrigger] = useState<Trigger>('habit')
  const [moodBefore, setMoodBefore] = useState<Mood>(3)
  const [moodAfter, setMoodAfter] = useState<Mood>(3)

  // 대안 활동 추천 (사용 시간 기반)
  const recommendedActivities = useMemo(() => getRecommendedActivities(minutes), [minutes])

  const handleSubmit = () => {
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      app,
      minutes,
      moodBefore,
      moodAfter,
      trigger,
    }
    addEntry(entry)

    // 의도적 사용이고 짧으면 절약한 시간으로 계산
    if (trigger === 'intentional' && minutes <= 15) {
      addTimeSaved(30 - minutes) // 30분 기준 절약
    }

    // 기분이 떨어졌거나 습관적/심심해서 사용했으면 대안 활동 추천
    if (moodAfter < moodBefore || trigger === 'habit' || trigger === 'boredom') {
      setStep(5) // 대안 활동 추천 단계로
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">사용 기록</h1>
      </header>

      <div className="max-w-sm mx-auto px-6 py-4">
        {/* Step 0: App selection */}
        {step === 0 && (
          <StepContainer title="어떤 앱을 사용했나요?">
            <div className="grid grid-cols-2 gap-3">
              {APPS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setApp(a.id); setStep(1) }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors text-left"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{a.label}</span>
                </button>
              ))}
            </div>
          </StepContainer>
        )}

        {/* Step 1: Time */}
        {step === 1 && (
          <StepContainer title="얼마나 사용했나요?">
            <div className="text-center">
              <span className="text-5xl font-bold text-primary">{minutes}</span>
              <span className="text-lg text-gray-500 ml-1">분</span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full mt-4 accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5분</span><span>1시간</span><span>2시간</span><span>3시간</span>
            </div>
            <button onClick={() => setStep(2)} className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-medium">
              다음
            </button>
          </StepContainer>
        )}

        {/* Step 2: Trigger */}
        {step === 2 && (
          <StepContainer title="왜 열었나요?">
            <div className="space-y-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTrigger(t.id); setStep(3) }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    trigger === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </StepContainer>
        )}

        {/* Step 3: Mood Before */}
        {step === 3 && (
          <StepContainer title="사용 전 기분은?">
            <div className="flex justify-center gap-4">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setMoodBefore(m.value); setStep(4) }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    moodBefore === m.value ? 'scale-110 bg-primary/10' : ''
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs text-gray-500">{m.label}</span>
                </button>
              ))}
            </div>
          </StepContainer>
        )}

        {/* Step 4: Mood After */}
        {step === 4 && (
          <StepContainer title="사용 후 기분은?">
            <div className="flex justify-center gap-4">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMoodAfter(m.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    moodAfter === m.value ? 'scale-110 bg-primary/10' : ''
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs text-gray-500">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Mood delta insight */}
            {moodAfter < moodBefore && (
              <div className="mt-4 p-3 bg-warning/10 rounded-xl text-sm text-warning border border-warning/20">
                기분이 떨어졌네요. 이 패턴을 기억해두면 다음에 도움이 될 거예요.
              </div>
            )}
            {moodAfter > moodBefore && (
              <div className="mt-4 p-3 bg-accent/10 rounded-xl text-sm text-accent border border-accent/20">
                기분이 좋아졌네요! 의도적인 사용이었나요?
              </div>
            )}

            <button onClick={handleSubmit} className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-medium">
              기록 완료
            </button>
          </StepContainer>
        )}

        {/* Step 5: Alternative Activities */}
        {step === 5 && (
          <StepContainer title="다음엔 이건 어때요?">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              {minutes}분 사용 대신 할 수 있는 활동들이에요
            </p>
            <div className="space-y-3">
              {recommendedActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              대시보드로 가기
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-2 py-3 text-gray-500 text-sm"
            >
              건너뛰기
            </button>
          </StepContainer>
        )}

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
                s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StepContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">{title}</h2>
      {children}
    </div>
  )
}

function ActivityCard({ activity }: { activity: Activity }) {
  const durationLabel = {
    5: '5분',
    15: '15분',
    30: '30분',
  }[activity.duration]

  const categoryColor = {
    movement: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    mindfulness: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    creative: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    social: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }[activity.category]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
      <div className="text-3xl">{activity.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white">{activity.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColor}`}>
            {durationLabel}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
      </div>
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
    </div>
  )
}
