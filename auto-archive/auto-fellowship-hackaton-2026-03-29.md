# Auto×Fellowship Hackaton — 2026-03-29

## Sprint #1 Summary

### Cycle 1: 챌린지-정원 보상 연동
**가설**: 챌린지 미션 완료 시 물방울 보상을 제공하면 동기부여 강화
**결과**: ✅ Confirmed
**변경**:
- `useStore.ts`: `addWaterDrops` 함수 추가
- `useStore.ts`: `useRewardedChallengeStore` 훅 생성 (미션 완료당 +3💧)
- `Challenges.tsx`: 보상 연동 + UI 표시
**학습**: 게이미피케이션 요소 간 연결이 동기부여의 핵심

### Cycle 2: 미션 완료 피드백 토스트
**가설**: 시각적 피드백이 있으면 보상을 즉시 인지
**결과**: ✅ Confirmed
**변경**:
- `components/Toast.tsx`: 글로벌 토스트 시스템
- `App.tsx`: ToastContainer 마운트
- `Challenges.tsx`: `showToast("🎉 미션 완료! +3💧")`
- `index.css`: slide-down 애니메이션
**학습**: 즉각적 피드백은 게이미피케이션 필수 요소

### Cycle 3: 정원 Empty State CTA
**가설**: 정원이 비어있을 때 CTA가 있으면 첫 행동 유도
**결과**: ✅ Confirmed
**변경**:
- `Garden.tsx`: empty/no-water 상태별 메시지 + "챌린지 시작하기" 버튼
**학습**: Empty state는 CTA 기회

---

## 축적된 학습
1. 게이미피케이션 요소 간 연결이 동기부여의 핵심
2. 즉각적 피드백(토스트)은 보상 인지에 필수
3. Empty state는 "막다른 길"이 아닌 CTA 기회
4. currentDay 진행 버그 발견 및 수정 (completeMission에서 currentDay 업데이트)

---

## Sprint #2 Summary

### Cycle 1: 챌린지 완료 특별 보상
**가설**: 챌린지 전체 완료 시 새 식물 보상이 장기 동기 강화
**결과**: ✅ Confirmed
**변경**:
- `challenges.ts`: `CHALLENGE_REWARDS` 정의 (3종 보상 식물)
- `useStore.ts`: `addPlant` 함수 추가
- `Challenges.tsx`: 보상 미리보기 + 완료 시 토스트
**학습**: 마일스톤 보상이 일일 보상보다 목표 지향적 동기 유발

### Cycle 2: 대시보드 인사이트
**가설**: 감정 변화 패턴 인사이트가 자기 인식 향상
**결과**: ✅ Confirmed
**변경**:
- `Dashboard.tsx`: `generateInsight` 함수 + 인사이트 카드 UI
**학습**: 로컬 데이터만으로 의미 있는 패턴 분석 가능

### Cycle 3: 챌린지 시작 씨앗
**가설**: 시작 시 씨앗 심기가 정원 연결감 즉시 형성
**결과**: ✅ Confirmed
**변경**:
- `challenges.ts`: `CHALLENGE_SEEDS` 정의
- `useStore.ts`: `startChallengeWithSeed`, `upgradePlant` 함수
- `Challenges.tsx`: 시작 버튼 씨앗 심기 연동
**학습**: 시작 보상이 "나의 것" 형성 → 애착 강화

---

## 전체 축적된 학습
1. 게이미피케이션 요소 간 연결이 동기부여의 핵심
2. 즉각적 피드백(토스트)은 보상 인지에 필수
3. Empty state는 "막다른 길"이 아닌 CTA 기회
4. 마일스톤 보상 > 일일 보상 (목표 지향)
5. 로컬 데이터 기반 인사이트 가능
6. 성장 내러티브: 씨앗 → 완성 (스토리텔링)
7. 구체적 행동 제안 포함 인사이트가 실행 가능성 높음

## 다음 스프린트 후보
- 주간 리포트 / 통계 시각화
- 대안 활동 추천 기능
- 마인드풀니스 인터셉트 (의도 확인)
