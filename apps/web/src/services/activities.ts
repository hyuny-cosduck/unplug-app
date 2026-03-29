// 대안 활동 추천 데이터
export interface Activity {
  id: string
  title: string
  description: string
  duration: 5 | 15 | 30 // minutes
  category: 'movement' | 'mindfulness' | 'creative' | 'social' | 'learning'
  emoji: string
}

export const ACTIVITIES: Activity[] = [
  // 5분 활동
  {
    id: 'stretch-5',
    title: '간단 스트레칭',
    description: '목, 어깨, 손목을 가볍게 풀어주세요',
    duration: 5,
    category: 'movement',
    emoji: '🧘',
  },
  {
    id: 'breathe-5',
    title: '호흡 명상',
    description: '눈을 감고 깊게 5번 호흡해보세요',
    duration: 5,
    category: 'mindfulness',
    emoji: '🌬️',
  },
  {
    id: 'water-5',
    title: '물 한 잔',
    description: '일어나서 물 한 잔 마시고 창밖을 봐보세요',
    duration: 5,
    category: 'mindfulness',
    emoji: '💧',
  },
  {
    id: 'doodle-5',
    title: '낙서하기',
    description: '종이에 아무거나 그려보세요',
    duration: 5,
    category: 'creative',
    emoji: '✏️',
  },

  // 15분 활동
  {
    id: 'walk-15',
    title: '동네 산책',
    description: '핸드폰 없이 가볍게 걸어보세요',
    duration: 15,
    category: 'movement',
    emoji: '🚶',
  },
  {
    id: 'journal-15',
    title: '오늘의 일기',
    description: '오늘 있었던 일 3가지를 적어보세요',
    duration: 15,
    category: 'mindfulness',
    emoji: '📝',
  },
  {
    id: 'music-15',
    title: '음악 감상',
    description: '좋아하는 앨범 3곡 들으며 눈 감기',
    duration: 15,
    category: 'creative',
    emoji: '🎵',
  },
  {
    id: 'call-15',
    title: '친구에게 연락',
    description: 'SNS 말고 직접 전화나 문자해보세요',
    duration: 15,
    category: 'social',
    emoji: '📞',
  },
  {
    id: 'tidy-15',
    title: '책상 정리',
    description: '주변을 깔끔하게 정리해보세요',
    duration: 15,
    category: 'movement',
    emoji: '🧹',
  },

  // 30분 활동
  {
    id: 'read-30',
    title: '책 읽기',
    description: '읽고 싶던 책 한 챕터 읽어보세요',
    duration: 30,
    category: 'learning',
    emoji: '📚',
  },
  {
    id: 'cook-30',
    title: '간단 요리',
    description: '간식이나 음료를 직접 만들어보세요',
    duration: 30,
    category: 'creative',
    emoji: '🍳',
  },
  {
    id: 'exercise-30',
    title: '홈트레이닝',
    description: '유튜브 없이 스쿼트, 플랭크 해보세요',
    duration: 30,
    category: 'movement',
    emoji: '💪',
  },
  {
    id: 'podcast-30',
    title: '팟캐스트 듣기',
    description: '관심 주제 에피소드 하나 들어보세요',
    duration: 30,
    category: 'learning',
    emoji: '🎙️',
  },
  {
    id: 'craft-30',
    title: '손으로 만들기',
    description: '종이접기, 뜨개질, 레고 등 손 활동',
    duration: 30,
    category: 'creative',
    emoji: '🎨',
  },
]

// 추천 알고리즘: 사용 시간에 맞는 활동 + 랜덤 셔플
export function getRecommendedActivities(usedMinutes: number): Activity[] {
  // 사용한 시간의 절반 정도를 대안 활동으로 추천
  const targetDuration = Math.min(30, Math.ceil(usedMinutes / 2))

  let filteredActivities: Activity[]

  if (targetDuration <= 5) {
    filteredActivities = ACTIVITIES.filter(a => a.duration === 5)
  } else if (targetDuration <= 15) {
    filteredActivities = ACTIVITIES.filter(a => a.duration === 5 || a.duration === 15)
  } else {
    filteredActivities = ACTIVITIES
  }

  // 셔플 후 상위 3개 반환
  return shuffleArray(filteredActivities).slice(0, 3)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
