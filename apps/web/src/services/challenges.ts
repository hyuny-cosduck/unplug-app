import type { Challenge, Plant } from '../types'

// 챌린지 시작 시 심는 씨앗
export const CHALLENGE_SEEDS: Record<string, Omit<Plant, 'id' | 'plantedDate'>> = {
  'mindful-mornings': {
    name: '아침의 씨앗',
    type: 'flower',
    stage: 0,
    health: 50,
    waterLevel: 30,
    sunlight: 30,
    emoji: '🌰',
  },
  'screen-free-meals': {
    name: '마음의 씨앗',
    type: 'herb',
    stage: 0,
    health: 50,
    waterLevel: 30,
    sunlight: 30,
    emoji: '🌰',
  },
  'dopamine-detox': {
    name: '의지의 씨앗',
    type: 'tree',
    stage: 0,
    health: 50,
    waterLevel: 30,
    sunlight: 30,
    emoji: '🌰',
  },
}

// 챌린지 완료 시 보상으로 받는 식물 (씨앗이 성장한 모습)
export const CHALLENGE_REWARDS: Record<string, Omit<Plant, 'id' | 'plantedDate'>> = {
  'mindful-mornings': {
    name: '아침 장미',
    type: 'flower',
    stage: 3,
    health: 80,
    waterLevel: 60,
    sunlight: 70,
    emoji: '🌹',
  },
  'screen-free-meals': {
    name: '마음의 허브',
    type: 'herb',
    stage: 3,
    health: 80,
    waterLevel: 60,
    sunlight: 70,
    emoji: '🌿',
  },
  'dopamine-detox': {
    name: '의지의 나무',
    type: 'tree',
    stage: 3,
    health: 80,
    waterLevel: 60,
    sunlight: 70,
    emoji: '🌲',
  },
}

// 챌린지 예상 효과
export const CHALLENGE_BENEFITS: Record<string, string[]> = {
  'mindful-mornings': ['아침이 여유로워져요', '하루를 능동적으로 시작해요', '집중력이 좋아져요'],
  'screen-free-meals': ['음식이 더 맛있어져요', '소화가 잘 돼요', '함께하는 시간이 풍요로워져요'],
  'dopamine-detox': ['작은 것에도 기쁨을 느껴요', '불안이 줄어들어요', 'SNS 없이도 괜찮아져요'],
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'mindful-mornings',
    title: '마음챙김 아침',
    description: '아침에 일어나서 30분간 SNS를 보지 않고, 대신 의도적인 아침 루틴을 만들어보세요.',
    difficulty: 'easy',
    durationDays: 7,
    category: 'replacement',
    dailyMissions: [
      { day: 1, title: '알람 끄고 5분 스트레칭', description: '핸드폰 대신 몸을 깨워보세요', completed: false },
      { day: 2, title: '아침 물 한잔 + 창밖 보기', description: '화면 대신 자연광을 맞이하세요', completed: false },
      { day: 3, title: '3분 호흡 명상', description: '조용히 앉아서 숨에 집중해보세요', completed: false },
      { day: 4, title: '아침 일기 3줄 쓰기', description: '오늘 하루 기대되는 것은?', completed: false },
      { day: 5, title: '산책 10분', description: '동네 한 바퀴, 핸드폰 없이', completed: false },
      { day: 6, title: '좋아하는 음악 듣기', description: '이어폰 끼고 음악에만 집중', completed: false },
      { day: 7, title: '일주일 돌아보기', description: '아침이 어떻게 달라졌나요?', completed: false },
    ],
  },
  {
    id: 'screen-free-meals',
    title: '화면 없는 식사',
    description: '식사할 때 핸드폰을 내려놓고, 음식의 맛과 함께하는 사람에 집중해보세요.',
    difficulty: 'easy',
    durationDays: 5,
    category: 'mindfulness',
    dailyMissions: [
      { day: 1, title: '점심 핸드폰 뒤집어 놓기', description: '화면이 안 보이게만 해도 달라요', completed: false },
      { day: 2, title: '음식 색깔 3가지 찾기', description: '눈앞의 음식을 자세히 봐보세요', completed: false },
      { day: 3, title: '첫 한 입 30초 씹기', description: '천천히 맛을 느껴보세요', completed: false },
      { day: 4, title: '식사 중 대화에 집중', description: '혼자라면 음악이나 라디오를', completed: false },
      { day: 5, title: '식후 5분 산책', description: '바로 핸드폰 대신 걸어보세요', completed: false },
    ],
  },
  {
    id: 'dopamine-detox',
    title: '도파민 디톡스 주간',
    description: '일주일간 SNS 사용을 점진적으로 줄이며, 뇌가 자연적인 보상에 다시 반응하도록 합니다.',
    difficulty: 'hard',
    durationDays: 7,
    category: 'reduction',
    dailyMissions: [
      { day: 1, title: '알림 전부 끄기', description: '푸시 알림을 모두 비활성화하세요', completed: false },
      { day: 2, title: 'SNS 앱 홈화면에서 빼기', description: '폴더 안으로 옮기세요', completed: false },
      { day: 3, title: '사용 시간 2시간 제한', description: '스크린타임으로 설정하세요', completed: false },
      { day: 4, title: '사용 시간 1시간 제한', description: '어제보다 1시간 줄여보세요', completed: false },
      { day: 5, title: '오후 6시 이후 SNS 금지', description: '저녁은 나를 위한 시간', completed: false },
      { day: 6, title: 'SNS 대신 책 읽기', description: '30분이라도 좋아요', completed: false },
      { day: 7, title: '하루 총 30분 이내 도전', description: '필수적인 확인만 하세요', completed: false },
    ],
  },
]
