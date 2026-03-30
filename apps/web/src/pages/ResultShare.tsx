import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

// Personality Types (duplicated from Onboarding for standalone page)
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
  percentage: number
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
    percentage: 3,
  },
}

// Character illustrations (same as Onboarding)
const CharacterIllustrations: Record<string, React.ReactNode> = {
  DOOM: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#8B5CF6" />
      <circle cx="60" cy="60" r="45" fill="#A78BFA" />
      <circle cx="45" cy="55" r="12" fill="white" />
      <circle cx="75" cy="55" r="12" fill="white" />
      <path d="M42 55 Q45 50 48 55 Q45 60 42 55" stroke="#8B5CF6" strokeWidth="2" fill="none" />
      <path d="M72 55 Q75 50 78 55 Q75 60 72 55" stroke="#8B5CF6" strokeWidth="2" fill="none" />
      <path d="M45 78 Q60 85 75 78" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="85" y="70" width="15" height="25" rx="3" fill="#1F2937" />
      <rect x="87" y="73" width="11" height="18" rx="1" fill="#60A5FA" />
    </svg>
  ),
  FOMO: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#F59E0B" />
      <circle cx="60" cy="60" r="45" fill="#FBBF24" />
      <ellipse cx="42" cy="55" rx="14" ry="16" fill="white" />
      <ellipse cx="78" cy="55" rx="14" ry="16" fill="white" />
      <circle cx="42" cy="55" r="8" fill="#1F2937" />
      <circle cx="78" cy="55" r="8" fill="#1F2937" />
      <circle cx="44" cy="53" r="3" fill="white" />
      <circle cx="80" cy="53" r="3" fill="white" />
      <path d="M30 42 L52 48" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 42 L68 48" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 80 Q60 75 75 80" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="25" r="10" fill="#EF4444" />
      <text x="95" y="29" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">3</text>
    </svg>
  ),
  MOOD: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#EC4899" />
      <circle cx="60" cy="60" r="45" fill="#F472B6" />
      <ellipse cx="42" cy="55" rx="10" ry="12" fill="white" />
      <ellipse cx="78" cy="55" rx="10" ry="12" fill="white" />
      <circle cx="42" cy="55" r="5" fill="#1F2937" />
      <circle cx="78" cy="55" r="5" fill="#1F2937" />
      <path d="M30 45 Q38 40 50 45" stroke="#9D174D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M70 48 Q82 43 90 48" stroke="#9D174D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M40 78 Q50 85 60 78" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 78 Q70 72 80 78" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="70" r="6" fill="#FDB5C7" opacity="0.6" />
      <circle cx="88" cy="70" r="6" fill="#FDB5C7" opacity="0.6" />
    </svg>
  ),
  BUSY: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#3B82F6" />
      <circle cx="60" cy="60" r="45" fill="#60A5FA" />
      <ellipse cx="42" cy="55" rx="10" ry="8" fill="white" />
      <ellipse cx="78" cy="55" rx="10" ry="8" fill="white" />
      <circle cx="42" cy="55" r="5" fill="#1F2937" />
      <circle cx="78" cy="55" r="5" fill="#1F2937" />
      <path d="M30 48 L52 50" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 48 L68 50" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 78 Q60 82 72 78" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="82" y="65" width="18" height="20" rx="2" fill="white" />
      <ellipse cx="91" cy="65" rx="9" ry="3" fill="#D4A574" />
      <path d="M100 70 Q108 75 100 80" stroke="white" strokeWidth="3" fill="none" />
      <path d="M20 25 L30 40 L25 40 L35 55 L22 38 L27 38 Z" fill="#FCD34D" />
    </svg>
  ),
  CHILL: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#10B981" />
      <circle cx="60" cy="60" r="45" fill="#34D399" />
      <rect x="28" y="48" width="28" height="18" rx="4" fill="#1F2937" />
      <rect x="64" y="48" width="28" height="18" rx="4" fill="#1F2937" />
      <path d="M56 55 L64 55" stroke="#1F2937" strokeWidth="3" />
      <path d="M45 78 Q60 88 75 78" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="85" r="12" fill="#FCD9B6" />
      <rect x="90" y="65" width="4" height="20" rx="2" fill="#FCD9B6" />
      <rect x="96" y="68" width="4" height="17" rx="2" fill="#FCD9B6" />
    </svg>
  ),
  ZEN: (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="50" fill="#6366F1" />
      <circle cx="60" cy="60" r="45" fill="#818CF8" />
      <path d="M32 55 Q42 50 52 55" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M68 55 Q78 50 88 55" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M45 75 Q60 85 75 75" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="60" cy="105" rx="25" ry="8" fill="#4F46E5" />
      <circle cx="25" cy="30" r="4" fill="#FCD34D" />
      <circle cx="95" cy="25" r="3" fill="#FCD34D" />
      <circle cx="100" cy="40" r="2" fill="#FCD34D" />
      <ellipse cx="60" cy="18" rx="20" ry="5" fill="none" stroke="#FCD34D" strokeWidth="2" />
    </svg>
  ),
}

export default function ResultShare() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()

  const typeCode = type?.toUpperCase() || 'DOOM'
  const result = PERSONALITY_TYPES[typeCode] || PERSONALITY_TYPES.DOOM

  // Update document title for better sharing
  useEffect(() => {
    document.title = `I'm a ${result.name} (${result.code}) | Unplug DTI`
  }, [result])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Result Card */}
        <div className={`bg-gradient-to-br ${result.gradient} rounded-3xl p-6 text-white shadow-xl`}>
          {/* Header with Character */}
          <div className="text-center mb-6">
            <div className="w-28 h-28 mx-auto mb-4 drop-shadow-lg">
              {CharacterIllustrations[result.code]}
            </div>
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

          <div className="bg-violet-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-violet-700 mb-1">💡 Pro Tip</h3>
            <p className="text-sm text-violet-600">{result.tip}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg"
          >
            Take the Test Yourself!
          </button>
          <p className="text-center text-xs text-gray-400">
            Discover your Digital Detox Type
          </p>
        </div>
      </div>
    </div>
  )
}
