import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, RefreshCw } from 'lucide-react'
import { useOnboarding, useGardenStore } from '../stores/useStore'
import { showToast } from '../components/Toast'

// ============================================
// DETOX TYPE INDICATOR (DTI) - Like MBTI for digital habits
// ============================================

// 6 Questions that determine your type
const QUIZ_QUESTIONS = [
  {
    id: 'timing',
    question: 'When do you first check your phone?',
    subtext: '아침에 언제 처음 폰을 확인하나요?',
    options: [
      { label: 'Before getting out of bed', sublabel: '이불 속에서 바로', value: 'A', emoji: '🛏️' },
      { label: 'During breakfast', sublabel: '아침 먹으면서', value: 'B', emoji: '🥐' },
      { label: 'After morning routine', sublabel: '씻고 준비 다 하고', value: 'C', emoji: '🚿' },
      { label: 'When I actually need it', sublabel: '필요할 때만', value: 'D', emoji: '✨' },
    ],
  },
  {
    id: 'notification',
    question: 'How do you react to notifications?',
    subtext: '알림이 오면 어떻게 하나요?',
    options: [
      { label: 'Check immediately, always', sublabel: '무조건 바로 확인', value: 'A', emoji: '⚡' },
      { label: 'Check when convenient', sublabel: '하던 거 끝나면 확인', value: 'B', emoji: '⏰' },
      { label: 'Batch check a few times a day', sublabel: '하루에 몇 번만 몰아서', value: 'C', emoji: '📦' },
      { label: 'Most notifications are off', sublabel: '대부분 꺼놨음', value: 'D', emoji: '🔕' },
    ],
  },
  {
    id: 'scroll',
    question: 'How does your scrolling usually end?',
    subtext: '스크롤은 보통 어떻게 끝나요?',
    options: [
      { label: '"Wait, it\'s been 2 hours?!"', sublabel: '"어? 벌써 2시간?!"', value: 'A', emoji: '😱' },
      { label: 'When something interrupts me', sublabel: '누가 부르거나 할 일 생기면', value: 'B', emoji: '👋' },
      { label: 'After catching up on new posts', sublabel: '새 글 다 보면 멈춤', value: 'C', emoji: '✅' },
      { label: 'I set time limits', sublabel: '타이머 맞춰놓고 함', value: 'D', emoji: '⏱️' },
    ],
  },
  {
    id: 'emotion',
    question: 'How do you feel after 30+ min of social media?',
    subtext: '30분 이상 SNS 후 기분은?',
    options: [
      { label: 'Empty or regretful', sublabel: '공허하거나 후회됨', value: 'A', emoji: '😔' },
      { label: 'Anxious comparing myself', sublabel: '남들과 비교하며 불안', value: 'B', emoji: '😰' },
      { label: 'Fine, but unproductive', sublabel: '괜찮은데 뭔가 아까움', value: 'C', emoji: '😐' },
      { label: 'Actually satisfied', sublabel: '만족스러움', value: 'D', emoji: '😊' },
    ],
  },
  {
    id: 'bored',
    question: 'When you\'re bored, what\'s your first instinct?',
    subtext: '심심할 때 첫 번째로 하는 건?',
    options: [
      { label: 'Open Instagram/TikTok/YouTube', sublabel: 'SNS 열기', value: 'A', emoji: '📱' },
      { label: 'Check messages/group chats', sublabel: '카톡/메시지 확인', value: 'B', emoji: '💬' },
      { label: 'Browse something specific', sublabel: '찾아볼 게 있어서 검색', value: 'C', emoji: '🔍' },
      { label: 'Do something offline', sublabel: '폰 말고 다른 거 함', value: 'D', emoji: '🎨' },
    ],
  },
  {
    id: 'sleep',
    question: 'What\'s your phone routine before bed?',
    subtext: '자기 전 폰 사용 패턴은?',
    options: [
      { label: 'Scroll until I pass out', sublabel: '기절할 때까지 스크롤', value: 'A', emoji: '😵' },
      { label: 'Watch "one more" video repeatedly', sublabel: '"이거 하나만" 반복', value: 'B', emoji: '🔁' },
      { label: 'Quick check, then sleep', sublabel: '잠깐 보고 잠', value: 'C', emoji: '👀' },
      { label: 'Phone stays outside bedroom', sublabel: '침실에 폰 안 가져감', value: 'D', emoji: '🌙' },
    ],
  },
]

// Personality Types based on answers
interface PersonalityType {
  code: string
  name: string
  nameKr: string
  emoji: string
  color: string
  gradient: string
  description: string
  descriptionKr: string
  strengths: string[]
  challenges: string[]
  tip: string
  compatibility: string[]
  percentage: number // % of users who are this type
}

const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  'DOOM': {
    code: 'DOOM',
    name: 'The Doom Scroller',
    nameKr: '무한스크롤러',
    emoji: '🌀',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
    description: 'You open apps without thinking and lose track of time. Your thumb has its own agenda.',
    descriptionKr: '무의식적으로 앱을 열고 시간 감각을 잃어요. 엄지가 제멋대로 움직여요.',
    strengths: ['Curious about everything', 'Always in the loop', 'Quick to spot trends'],
    challenges: ['Time blindness', 'Sleep issues', 'Hard to focus'],
    tip: 'Try the "Phone Pickup" awareness challenge - just notice when you reach for your phone.',
    compatibility: ['FOMO', 'CHILL'],
    percentage: 28,
  },
  'FOMO': {
    code: 'FOMO',
    name: 'The FOMO Fighter',
    nameKr: '포모파이터',
    emoji: '👀',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    description: 'Fear of missing out drives your usage. If you don\'t check, something important might happen!',
    descriptionKr: '놓칠까봐 불안해서 계속 확인해요. 안 보면 중요한 일이 생길 것 같아요!',
    strengths: ['Great at staying connected', 'Responsive friend', 'Up-to-date on news'],
    challenges: ['Anxiety when offline', 'Notification addiction', 'Hard to disconnect'],
    tip: 'Schedule "offline hours" with friends so you\'re missing out together!',
    compatibility: ['DOOM', 'MOOD'],
    percentage: 24,
  },
  'MOOD': {
    code: 'MOOD',
    name: 'The Mood Regulator',
    nameKr: '감정피난처',
    emoji: '🎭',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    description: 'You use social media to escape uncomfortable feelings. It\'s your emotional pacifier.',
    descriptionKr: '불편한 감정을 피하려고 SNS를 써요. 감정의 피난처가 되어버렸어요.',
    strengths: ['Emotionally aware', 'Seek connection', 'Creative outlet'],
    challenges: ['Avoidance patterns', 'Comparison trap', 'Emotional dependency'],
    tip: 'Before opening an app, ask: "What am I actually feeling right now?"',
    compatibility: ['FOMO', 'CHILL'],
    percentage: 21,
  },
  'BUSY': {
    code: 'BUSY',
    name: 'The Productive Procrastinator',
    nameKr: '생산적미루기왕',
    emoji: '⚡',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-500',
    description: 'You\'re not addicted - you\'re just "taking a quick break" that lasts 45 minutes.',
    descriptionKr: '중독 아니에요 - 그냥 "잠깐 쉬는 중"인데 45분이 지나있어요.',
    strengths: ['High achiever mindset', 'Aware of the problem', 'Good intentions'],
    challenges: ['Procrastination', 'Guilt cycle', 'Work-life blur'],
    tip: 'Use the Pomodoro technique: 25 min work, 5 min phone, repeat.',
    compatibility: ['CHILL', 'ZEN'],
    percentage: 18,
  },
  'CHILL': {
    code: 'CHILL',
    name: 'The Casual Scroller',
    nameKr: '여유스크롤러',
    emoji: '😎',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    description: 'You use social media but it doesn\'t control you. Still, you want to be more intentional.',
    descriptionKr: 'SNS를 쓰지만 휘둘리진 않아요. 그래도 더 의식적으로 쓰고 싶어요.',
    strengths: ['Good self-awareness', 'Balanced approach', 'Open to improvement'],
    challenges: ['Occasional time loss', 'Could be more present', 'Room for optimization'],
    tip: 'You\'re ready for advanced challenges like "No Phone Sundays"!',
    compatibility: ['ZEN', 'BUSY'],
    percentage: 6,
  },
  'ZEN': {
    code: 'ZEN',
    name: 'The Digital Minimalist',
    nameKr: '디지털미니멀리스트',
    emoji: '🧘',
    color: '#6366F1',
    gradient: 'from-indigo-400 to-violet-400',
    description: 'You\'ve already got great digital habits! You\'re here to help friends or level up.',
    descriptionKr: '이미 훌륭한 디지털 습관을 가지고 있어요! 친구를 돕거나 레벨업하러 왔군요.',
    strengths: ['Strong boundaries', 'Intentional user', 'Great role model'],
    challenges: ['Sometimes miss out', 'Can seem disconnected', 'High standards'],
    tip: 'Lead a group challenge and share your secrets with friends!',
    compatibility: ['CHILL', 'BUSY'],
    percentage: 3,
  },
}

type QuizAnswers = Record<string, string>

function calculateType(answers: QuizAnswers): PersonalityType {
  const values = Object.values(answers)
  const aCount = values.filter(v => v === 'A').length
  const bCount = values.filter(v => v === 'B').length
  const cCount = values.filter(v => v === 'C').length
  const dCount = values.filter(v => v === 'D').length

  // High A answers = problematic patterns
  if (aCount >= 4) {
    // Check specific patterns
    if (answers.emotion === 'B' || answers.bored === 'B') {
      return PERSONALITY_TYPES.FOMO
    }
    if (answers.emotion === 'A') {
      return PERSONALITY_TYPES.MOOD
    }
    return PERSONALITY_TYPES.DOOM
  }

  // Mix of A and B = moderate issues
  if (aCount >= 2 && bCount >= 2) {
    if (answers.emotion === 'B') return PERSONALITY_TYPES.FOMO
    if (answers.emotion === 'A') return PERSONALITY_TYPES.MOOD
    return PERSONALITY_TYPES.BUSY
  }

  // Mostly B and C = casual user
  if (bCount >= 2 && cCount >= 2) {
    return PERSONALITY_TYPES.BUSY
  }

  // Mostly C and D = healthy user
  if (cCount + dCount >= 4) {
    if (dCount >= 4) return PERSONALITY_TYPES.ZEN
    return PERSONALITY_TYPES.CHILL
  }

  // Default to casual
  return PERSONALITY_TYPES.CHILL
}

export default function Onboarding() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro')
  const [quizStep, setQuizStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const resultCardRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { completeOnboarding } = useOnboarding()
  const { addWaterDrops } = useGardenStore()

  const handleAnswer = (questionId: string, value: string) => {
    setSelectedAnswer(value)
    setTimeout(() => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      setSelectedAnswer(null)
      if (quizStep < QUIZ_QUESTIONS.length - 1) {
        setQuizStep(quizStep + 1)
      } else {
        setPhase('result')
      }
    }, 300)
  }

  const handleComplete = (destination = '/group/create') => {
    completeOnboarding()
    addWaterDrops(5)
    navigate(destination)
  }

  const handleShare = async () => {
    const shareText = `I'm a ${result.name} (${result.code}) on my digital detox journey! 🌱\n\n${result.descriptionKr}\n\nTake the test: unplug-together.vercel.app`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Detox Type: ${result.code}`,
          text: shareText,
        })
      } catch {
        // User cancelled or share failed
        await navigator.clipboard.writeText(shareText)
        showToast('Copied to clipboard!')
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      showToast('Copied to clipboard!')
    }
  }

  const handleRetake = () => {
    setPhase('intro')
    setQuizStep(0)
    setAnswers({})
  }

  const result = calculateType(answers)
  const currentQuestion = QUIZ_QUESTIONS[quizStep]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">

        {/* Phase 1: Intro */}
        {phase === 'intro' && (
          <div className="text-center">
            {/* Animated Icons */}
            <div className="flex justify-center gap-3 mb-6">
              {['🌀', '👀', '🎭', '⚡', '😎', '🧘'].map((emoji, i) => (
                <span
                  key={emoji}
                  className="text-3xl animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <span>DTI</span>
              <span className="text-violet-400">•</span>
              <span>Detox Type Indicator</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              What's Your<br />Digital Detox Type?
            </h1>
            <p className="text-gray-500 mb-2">
              나의 디지털 디톡스 유형은?
            </p>
            <p className="text-sm text-gray-400 mb-8">
              6 questions • 1 minute • Shareable result
            </p>

            <button
              onClick={() => setPhase('quiz')}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-200 hover:shadow-xl transition-shadow"
            >
              Start Test
            </button>

            <button
              onClick={() => handleComplete()}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600"
            >
              Skip for now
            </button>

            {/* Social proof */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">Join 1,000+ people who discovered their type</p>
              <div className="flex justify-center -space-x-2">
                {['😀', '🦊', '🐰', '🤓', '😎', '🐻'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-sm">
                    {e}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border-2 border-white text-xs font-medium text-violet-600">
                  +99
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Quiz */}
        {phase === 'quiz' && currentQuestion && (
          <div>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <span className="text-sm text-violet-600 font-medium">
                  {Math.round(((quizStep + 1) / QUIZ_QUESTIONS.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 ease-out"
                  style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentQuestion.question}
              </h2>
              <p className="text-sm text-gray-400">
                {currentQuestion.subtext}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  disabled={selectedAnswer !== null}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    selectedAnswer === option.value
                      ? 'border-violet-500 bg-violet-50 scale-[0.98]'
                      : 'border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/50'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Result */}
        {phase === 'result' && (
          <div className="space-y-6">
            {/* Result Card */}
            <div
              ref={resultCardRef}
              className={`bg-gradient-to-br ${result.gradient} rounded-3xl p-6 text-white shadow-xl`}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{result.emoji}</div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium mb-3">
                  <span>DTI</span>
                  <span className="opacity-60">•</span>
                  <span>{result.code}</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{result.name}</h2>
                <p className="text-white/80">{result.nameKr}</p>
              </div>

              {/* Description */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
                <p className="text-sm leading-relaxed">{result.description}</p>
                <p className="text-sm text-white/70 mt-2">{result.descriptionKr}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {result.percentage}% of users
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              {/* Strengths */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">💪 Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map((s, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Challenges */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">🎯 Challenges</h3>
                <div className="flex flex-wrap gap-2">
                  {result.challenges.map((c, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-violet-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-violet-700 mb-1">💡 Pro Tip</h3>
                <p className="text-sm text-violet-600">{result.tip}</p>
              </div>

              {/* Compatibility */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">🤝 Best Detox Partners</h3>
                <div className="flex gap-2">
                  {result.compatibility.map((code) => {
                    const type = PERSONALITY_TYPES[code]
                    return (
                      <div key={code} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                        <span>{type.emoji}</span>
                        <span className="text-sm font-medium text-gray-700">{code}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleComplete('/group/create')}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Create a Detox Group
              </button>
              <button
                onClick={() => handleComplete('/group/join')}
                className="w-full py-3 bg-white border-2 border-violet-200 text-violet-600 rounded-2xl font-medium hover:bg-violet-50 transition-colors"
              >
                Join Friend's Group
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              +5💧 bonus for completing the test!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
