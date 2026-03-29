import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, Clock, TrendingDown, Gift } from 'lucide-react'
import { useGroupStore } from '../stores/useStore'
import { showToast } from '../components/Toast'

const CHALLENGE_TEMPLATES = [
  {
    id: 'reduce-50',
    title: 'Cut by Half',
    description: 'Reduce SNS time by 50% this week',
    goalType: 'reduce_percent' as const,
    goalValue: 50,
    emoji: '✂️',
  },
  {
    id: 'max-2h',
    title: 'Max 2 Hours',
    description: 'Keep daily SNS under 2 hours',
    goalType: 'max_hours' as const,
    goalValue: 2,
    emoji: '⏰',
  },
  {
    id: 'max-1h',
    title: 'Max 1 Hour',
    description: 'Keep daily SNS under 1 hour',
    goalType: 'max_hours' as const,
    goalValue: 1,
    emoji: '🎯',
  },
  {
    id: 'no-morning',
    title: 'Morning Free',
    description: 'No SNS before 10 AM',
    goalType: 'no_sns_hours' as const,
    goalValue: 10,
    emoji: '🌅',
  },
]

const PENALTIES = [
  { id: 'coffee', label: 'Buy coffee', emoji: '☕' },
  { id: 'lunch', label: 'Buy lunch', emoji: '🍽️' },
  { id: 'chores', label: 'Do a chore', emoji: '🧹' },
  { id: 'pushups', label: '50 pushups', emoji: '💪' },
]

const REWARDS = [
  { id: 'party', label: 'Group party', emoji: '🎉' },
  { id: 'movie', label: 'Movie night', emoji: '🎬' },
  { id: 'dinner', label: 'Nice dinner', emoji: '🍝' },
  { id: 'nothing', label: 'Satisfaction', emoji: '😌' },
]

export default function GroupChallenge() {
  const navigate = useNavigate()
  const { group, startChallenge } = useGroupStore()

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [penalty, setPenalty] = useState<string>('')
  const [reward, setReward] = useState<string>('')
  const [duration, setDuration] = useState(7)

  if (!group) {
    navigate('/group/create')
    return null
  }

  const template = CHALLENGE_TEMPLATES.find(t => t.id === selectedTemplate)

  const handleStart = () => {
    if (!template) return

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + duration)

    startChallenge({
      title: template.title,
      description: template.description,
      goalType: template.goalType,
      goalValue: template.goalValue,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      penalty: penalty || undefined,
      reward: reward || undefined,
    })

    showToast('Challenge started!')
    navigate('/group')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-6 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate('/group')} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Challenge</h1>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* Challenge Selection */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Choose a Goal
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CHALLENGE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTemplate === t.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-2xl mb-2">{t.emoji}</div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </h2>
          <div className="flex gap-2">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  duration === d
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Penalty */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Penalty for Failing
          </h2>
          <div className="flex flex-wrap gap-2">
            {PENALTIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPenalty(penalty === p.label ? '' : p.label)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  penalty === p.label
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                <span className="mr-1">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reward */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Reward for Success
          </h2>
          <div className="flex flex-wrap gap-2">
            {REWARDS.map((r) => (
              <button
                key={r.id}
                onClick={() => setReward(reward === r.label ? '' : r.label)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  reward === r.label
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                <span className="mr-1">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {template && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
            <h3 className="font-bold text-gray-900 mb-3">Challenge Summary</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-gray-500">Goal:</span>
                <span className="font-medium text-gray-900">
                  {template.title} - {template.description}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium text-gray-900">{duration} days</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-500">Members:</span>
                <span className="font-medium text-gray-900">
                  {group.members.map(m => m.emoji).join(' ')} ({group.members.length} people)
                </span>
              </p>
              {penalty && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Loser pays:</span>
                  <span className="font-medium text-red-600">{penalty}</span>
                </p>
              )}
              {reward && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Winner gets:</span>
                  <span className="font-medium text-green-600">{reward}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!template}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Challenge
        </button>
      </div>
    </div>
  )
}
