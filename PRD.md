# PRD: Unplug — Group-Based Digital Detox Platform

> **Product Name**: Unplug (언플러그)
> **Version**: 1.0.0
> **Date**: 2026-03-29
> **Author**: hyunnie × Claude Code
> **Status**: MVP Live
> **Live URL**: https://unplug-together.vercel.app

---

## 1. Problem Statement (문제 정의)

### 핵심 문제
디지털 미디어(SNS) 중독은 현대 사회의 심각한 공중보건 이슈다.

- 한국 성인 평균 스마트폰 사용 시간: **하루 5시간 이상**
- 10~20대 SNS 사용 시간: **하루 3시간 이상**
- SNS 과다 사용과 우울, 불안, 수면 장애, 집중력 저하 간 상관관계 다수 연구에서 확인

### 왜 기존 솔루션이 실패하는가

| 기존 접근 | 실패 이유 |
|----------|-----------|
| 스크린 타임 제한 | 사용자가 직접 해제함 |
| 앱 차단 | 우회 방법을 찾음 |
| 의지력 호소 | 도파민을 이길 수 없음 |
| 개인 챌린지 | 아무도 보지 않으면 포기 |
| 혼자 하는 앱 | 95%가 2주 내 사용 중단 |

### 핵심 인사이트
> **"SNS 중독은 혼자 이길 수 없다. 친구들과 함께 이긴다."**

연구에 따르면 사회적 책임감(Social Accountability)이 있을 때:
- 습관 유지율 **3배** 증가
- 챌린지 완료율 **70%** 달성
- 재발률 **50%** 감소

---

## 2. Vision (비전)

> **"Not alone. Together."**
> **"혼자가 아니라, 함께."**

Unplug는 SNS 중독을 **친구들과 함께 이기는** 플랫폼이다.
차단이 아닌 **사회적 압박 + 경쟁 + 실제 보상/벌칙**으로 행동 변화를 유도한다.

---

## 3. Target Users (타겟 사용자)

### Primary: 10대 후반 ~ 30대 초반
- SNS 줄이고 싶은 친구 그룹
- 함께 도전하고 싶은 2명 이상의 친구들
- 내기/벌칙 문화에 익숙한 MZ세대

### Use Cases
1. **대학생 친구 그룹**: "우리 시험 기간에 SNS 1시간 제한하자, 실패하면 치킨 쏘기"
2. **직장 동료들**: "이번 달 업무 시간 SNS 금지, 지키면 회식"
3. **커플/가족**: "아침 10시 전 SNS 금지, 안 지키면 설거지"

---

## 4. Approach — 사회적 책임감 모델

### 핵심 메커니즘

```
┌─────────────────────────────────────────────────────────┐
│                    UNPLUG LOOP                          │
│                                                         │
│   그룹 생성 → 챌린지 설정 → 매일 기록 → 순위 공개      │
│       ↑                                         ↓       │
│       └────── 벌칙/보상 ←── 결과 판정 ←─────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 왜 이게 작동하는가

| 기능 | 심리학 원리 | 효과 |
|------|------------|------|
| 리더보드 | 사회적 비교 이론 | "친구보다 많이 쓰면 창피해" |
| 친구 너지 | 사회적 압박 | "실시간으로 지켜보고 있어" |
| 벌칙 설정 | 손실 회피 | "커피 사기 싫으니까 참자" |
| 보상 설정 | 목표 그래디언트 | "단체 회식을 위해 버티자" |
| 그룹 기반 | 소속감 | "나 혼자 실패하면 민폐" |

---

## 5. Core Features (핵심 기능) — MVP ✅

### 5.1 그룹 생성 및 초대
- 그룹 이름 설정
- 초대 코드 생성 (6자리)
- 친구 추가 (최소 2명 필요)
- 이모지 아바타 선택

### 5.2 그룹 대시보드
- **오늘의 리더보드**: 오늘 SNS 사용량 순위
- **주간 통계**: 멤버별 총 사용 시간 비교
- **내 현황**: 순위, 이번 주 총 사용량, 기록한 날 수
- **스크린 타임 기록**: 매일 사용 시간 입력

### 5.3 그룹 챌린지
- **챌린지 템플릿**:
  - ✂️ Cut by Half: SNS 50% 감소
  - ⏰ Max 2 Hours: 하루 2시간 이하
  - 🎯 Max 1 Hour: 하루 1시간 이하
  - 🌅 Morning Free: 오전 10시 전 SNS 금지
- **기간 선택**: 3일, 7일, 14일, 30일
- **벌칙 설정**: 커피 사기, 점심 사기, 집안일, 푸시업 50개
- **보상 설정**: 단체 파티, 영화, 저녁 식사

### 5.4 친구 너지 (Nudge)
- 실시간으로 친구에게 "너 너무 많이 쓰고 있어!" 알림 전송
- SNS 오래 하는 친구에게 가벼운 압박

### 5.5 스크린 타임 기록
- 슬라이더로 오늘 사용 시간 입력 (0~5시간)
- 선택적 스크린샷 업로드 (검증용)

---

## 6. Technical Architecture

### 6.1 Tech Stack
```
Frontend:  React 18 + TypeScript + Tailwind CSS v4
           PWA (Progressive Web App)
           Vite 8 (번들러)
           Zustand (상태 관리)

Storage:   localStorage (MVP)
           → Phase 2: Supabase + PostgreSQL

Deploy:    Vercel (프론트엔드)

Domain:    unplug-together.vercel.app
```

### 6.2 Project Structure
```
fellowship-hackaton/
├── PRD.md                          # 이 문서
├── apps/
│   └── web/                        # React PWA
│       ├── src/
│       │   ├── components/
│       │   │   ├── BottomNav.tsx   # 하단 네비게이션
│       │   │   └── Toast.tsx       # 토스트 알림
│       │   ├── pages/
│       │   │   ├── Landing.tsx     # 랜딩 페이지
│       │   │   ├── Onboarding.tsx  # 온보딩 퀴즈
│       │   │   ├── GroupCreate.tsx # 그룹 생성
│       │   │   ├── GroupDashboard.tsx # 그룹 대시보드
│       │   │   ├── GroupChallenge.tsx # 챌린지 설정
│       │   │   └── UsageLog.tsx    # 사용량 기록
│       │   ├── stores/
│       │   │   └── useStore.ts     # Zustand 스토어
│       │   └── types/
│       │       └── index.ts        # TypeScript 타입
│       └── public/
│           └── favicon.svg         # Unplug 로고
├── auto-archive/
│   └── mission-ledger.md           # 스프린트 기록
├── Unplug_Presentation.pptx        # 발표 자료
├── Unplug_Chat_History.xlsx        # 개발 대화 기록
└── CLAUDE.md                       # 프로젝트 컨텍스트
```

---

## 7. Data Models

### Group
```typescript
interface Group {
  id: string
  name: string
  code: string           // 6자리 초대 코드
  createdAt: string
  members: GroupMember[]
  currentChallenge?: GroupChallenge
  challengeHistory: GroupChallenge[]
  progress: MemberProgress[]
}
```

### GroupMember
```typescript
interface GroupMember {
  id: string
  name: string
  emoji: string
  joinedAt: string
  isMe: boolean
}
```

### GroupChallenge
```typescript
interface GroupChallenge {
  id: string
  title: string
  description: string
  goalType: 'reduce_percent' | 'max_hours' | 'no_sns_hours'
  goalValue: number
  startDate: string
  endDate: string
  penalty?: string
  reward?: string
}
```

### MemberProgress
```typescript
interface MemberProgress {
  memberId: string
  date: string           // YYYY-MM-DD
  minutes: number
  screenshotUrl?: string
  verified: boolean
}
```

---

## 8. Success Metrics (성공 지표)

### North Star Metric
**그룹 챌린지 완료율** (목표: 70%+)

### Primary Metrics
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 그룹 생성 수 | 100+ groups | 데이터베이스 |
| 멤버당 평균 기록 일수 | 5일/주 | 로그 데이터 |
| 챌린지 완료율 | 70%+ | 시작 vs 완료 |
| 그룹 유지율 (2주) | 60%+ | 활성 그룹 비율 |

### Secondary Metrics
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 너지 발송 횟수 | 주 3회/멤버 | 로그 |
| 벌칙 이행률 | 80%+ | 사용자 피드백 |
| 평균 그룹 크기 | 3-4명 | 데이터 |
| 재참여율 | 40%+ | 챌린지 종료 후 재시작 |

---

## 9. Risks & Mitigations (리스크)

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| 거짓 기록 | High | 스크린샷 인증 (선택), 친구 검증 |
| 그룹 와해 | Mid | 최소 2명 유지, 리마인더 알림 |
| 벌칙 미이행 | Mid | 사회적 압박 활용, 앱 내 기록 |
| 너지 악용 | Low | 하루 너지 횟수 제한 |
| 동기 소진 | Mid | 짧은 챌린지 옵션 (3일), 쉬운 목표 |

---

## 10. Roadmap

### Phase 1: MVP ✅ (완료)
- [x] 그룹 생성 및 초대 코드
- [x] 그룹 대시보드 및 리더보드
- [x] 챌린지 시스템 (4가지 템플릿)
- [x] 친구 너지 기능
- [x] 스크린 타임 기록
- [x] Vercel 배포

### Phase 2: Backend (다음)
- [ ] Supabase 연동 (실시간 동기화)
- [ ] 사용자 인증 (카카오/구글)
- [ ] 푸시 알림
- [ ] 스크린샷 업로드 및 저장

### Phase 3: 고도화
- [ ] 챌린지 결과 리포트
- [ ] 벌칙 이행 확인 시스템
- [ ] 그룹 히스토리
- [ ] 성공 스토리 공유

### Phase 4: 확장
- [ ] 공개 챌린지 (모르는 사람과)
- [ ] 리그 시스템 (그룹 vs 그룹)
- [ ] 기업용 팀 챌린지
- [ ] iOS/Android 네이티브 앱

---

## 11. Key Learnings (핵심 학습)

### 피봇 이유
초기 버전은 개인 중심 + 게이미피케이션 (가상 정원, 챌린지, 저널)이었으나:
1. 혼자 하는 앱은 2주 내 95%가 이탈
2. 게이미피케이션은 또 하나의 중독이 될 위험
3. 의지력 기반 접근은 도파민을 이길 수 없음

### 새로운 방향
- **사회적 책임감**이 가장 강력한 동기부여
- 친구들과 함께하면 3배 더 오래 지속
- 실제 벌칙/보상이 있어야 진지하게 참여
- 리더보드 공개가 가장 효과적인 압박

---

## 12. Team

- **hyunnie**: Product Owner, Developer
- **Claude Code**: AI Pair Programmer

---

## 13. Links

- **Live App**: https://unplug-together.vercel.app
- **Presentation**: `Unplug_Presentation.pptx`
- **Chat History**: `Unplug_Chat_History.xlsx`
