# Digital Detox — Fellowship Hackaton

## Project Overview
SNS/디지털 미디어 중독 해결 플랫폼. 차단이 아닌 **인식 → 동기부여 → 대안 → 커뮤니티** 접근.

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + Vite (PWA)
- Backend: Node.js + Express + PostgreSQL + Prisma
- AI: Claude API (인사이트 생성)

## Project Structure
```
apps/web/          — React PWA (포트 5173)
apps/api/          — Backend API
auto-archive/      — Auto 스프린트 아카이브
PRD.md             — 제품 요구사항 문서
```

## Commands
- `npm run dev` — 개발 서버 (apps/web)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — 린트
- `npx tsc --noEmit` — 타입 체크

## Skills
- `/fellowship-hackaton` — 프로젝트 컨텍스트 모드
- `/auto-fellowship-hackaton` — 자율주행 가설-검증 스프린트

## Conventions
- TypeScript strict mode
- Tailwind CSS utility classes
- React hooks (no class components)
- Mobile-first responsive design
- 접근성(a11y) 준수
- 윤리적 UX: 다크패턴 금지, 자체 사용 제한 메커니즘 포함
