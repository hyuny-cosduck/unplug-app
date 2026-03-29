# Claude Code Skills & Setup Guide

> **Last updated**: 2026-03-03
> **Total skills**: 35 commands + 1 agent + 2 hooks
> **Source**: `~/.claude/commands/`, `~/.claude/agents/`, `~/.claude/hooks/`

---

## Quick Setup (다른 PC에서 실행)

```bash
#!/bin/bash
# Claude Code 스킬 셋업 스크립트
# 사용법: bash claude-skills-setup.md  (이 파일 자체를 실행 가능)

SOURCE_PC="juno@<원본PC-IP>"  # 원본 PC IP로 변경

# 1. 디렉토리 생성
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/hooks
mkdir -p ~/.claude/projects/-Users-juno/memory

# 2. 스킬 파일 복사 (rsync)
rsync -avz "$SOURCE_PC:~/.claude/commands/" ~/.claude/commands/
rsync -avz "$SOURCE_PC:~/.claude/agents/" ~/.claude/agents/
rsync -avz "$SOURCE_PC:~/.claude/hooks/" ~/.claude/hooks/
rsync -avz "$SOURCE_PC:~/.claude/settings.json" ~/.claude/settings.json
rsync -avz "$SOURCE_PC:~/.claude/projects/-Users-juno/memory/" ~/.claude/projects/-Users-juno/memory/

echo "Done! 총 $(ls ~/.claude/commands/*.md | wc -l) 스킬 설치됨"
```

---

## 디렉토리 구조

```
~/.claude/
├── settings.json              # hooks 설정 (PermissionRequest, PreCompact)
├── commands/                  # 슬래시 커맨드 (스킬) — 35개
│   ├── 0.md                   # Project Zero 총괄
│   ├── fas.md ... zero.md     # 업무 모드 (9개)
│   ├── auto.md                # 자율주행 베이스
│   ├── auto-*.md              # 자율주행 변형 (20개)
│   ├── context.md             # 대화 이력 로딩
│   ├── context-search.md      # 대화 이력 검색
│   ├── fix-github-issue.md    # GitHub 이슈 자동 수정
│   ├── auto-skill.md          # 스킬 매니저
│   └── stop.md                # 세션 저장/종료
├── agents/                    # 커스텀 에이전트 — 1개
│   └── prd-github-issue-creator.md
├── hooks/                     # 훅 스크립트 — 2개
│   ├── permission-broker.py   # Auto-Auto 권한 브로커 (144줄)
│   └── pre-compact.py         # 컨텍스트 압축 전 처리 (137줄)
└── projects/-Users-juno/memory/
    └── MEMORY.md              # 자동 메모리
```

---

## 전체 스킬 목록

### 1. Project Zero — 총괄 오케스트레이터

| 스킬 | 설명 | 줄수 |
|------|------|------|
| `/0` | 전체 AI 프로젝트 총괄. 모든 CLAUDE.md 로딩, 서버 헬스체크, 태스크 디스패치 | 230 |

### 2. Work Mode — 업무 모드 진입 (9개)

| 스킬 | 시스템 | 포트 | 설명 | 줄수 |
|------|--------|------|------|------|
| `/fas` | F1 Autonomous System | 7700 | 토큰 풀, 회로 차단기, WRR 라우팅 | 190 |
| `/mas` | Master Agent System | 7720 | 178 페르소나, 트라이브 라우팅, 합성 프로토콜 | 139 |
| `/nas` | Node Agent System | 7730 | 노드 관리, SSH 원격실행, CDP 브라우저 | 154 |
| `/amm` | Autonomous Memory Metabolism | Qdrant:6333 | 메모리 파이프라인 7단계, vLLM 임베딩 | 153 |
| `/gateway` | OpenClaw Gateway | 3000/18789 | f1crew 게이트웨이 TS 코드베이스 | 138 |
| `/infra` | Infrastructure Layer | 7810-7840 | EventBus, LogBus, Vault, ConfigStore, Backup | 154 |
| `/xapi` | xapi Gateway | 7750 | 통합 API 게이트웨이, 모든 서비스 프록시 | 154 |
| `/zero` | Zero (AI Agent System) | all | OpenClaw/f1crew 전체 고도화, 풀 대시보드 | 268 |
| `/starverse` | STARVERSE | - | 가상 K-pop 유니버스, Project 0 엔진 | 123 |

### 3. Auto — 자율주행 모드 (20개)

**7-Phase 과학적 방법**: Observe → Hypothesize → Design → Execute → Verify → Apply → Derive

| 스킬 | 탐구 대상 | 핵심 특징 | 줄수 |
|------|-----------|-----------|------|
| `/auto` | 범용 | 베이스 자율주행, `auto/rules.yml` 기반 | 264 |
| `/auto-fas` | FAS | 토큰 풀/회로차단기, xapi `/fas/*` 우선 | 238 |
| `/auto-mas` | MAS | 페르소나 선택 정확도, 트라이브 라우팅 | 257 |
| `/auto-nas` | NAS | 노드 관리, SSH, 태그, 에이전트 하트비트 | 255 |
| `/auto-amm` | AMM | 7단계 파이프라인 (intake~briefing) | 317 |
| `/auto-gateway` | Gateway | TS 코드 5가지 심층분석 렌즈, git 커밋 | 223 |
| `/auto-xapi` | xapi | 엔드포인트 발견/개선, scaffold 시스템 | 215 |
| `/auto-infra` | Infra | EventBus~Backup, SSH 기반 관찰 | 282 |
| `/auto-zero` | Zero (전체) | 5단계 구조적 사고, 4티어 진화 나침반 | 314 |
| `/auto-starverse` | STARVERSE | 시스템/메카닉/데이터 일관성, 엔진 활용 | 190 |
| `/auto-gateway-xapi` | Gateway×xapi | Gateway(TS)↔xapi(Python) 통합 경계 | 218 |
| `/auto-infra-xapi` | Infra×xapi | 인프라 API → xapi 라우트 스캐폴딩 | 251 |
| `/auto-zero-xapi` | Zero×xapi | subprocess/SSH/파일I/O → xapi 전환 | 279 |
| `/auto-zero-debugging` | Zero×Debugging | 슬랙 실제 메시지 테스트, 6축 품질 평가 | 439 |
| `/auto-library` | Library | Slack/워크스페이스/봇 메모리 → 라이브러리 | 291 |
| `/auto-browsing` | Browsing | NAS/CDP + Gateway/Playwright 최적화 | 384 |
| `/auto-amazon-heeda` | Amazon×HEEDA | Helium 10 브라우저 자동화, 광고 전략 | 586 |
| `/auto-auto` | Auto-Auto | Permission Broker 기반 완전 자율주행 | 146 |
| `/auto-auto-exit` | Auto-Auto 종료 | Permission Broker 상태 확인 후 종료 | 57 |
| `/auto-skill` | 스킬 매니저 | 전체 스킬 조회/분류/중복감지/최적화 | 181 |

### 4. Session Management — 세션 관리 (3개)

| 스킬 | 설명 | 줄수 |
|------|------|------|
| `/auto-out` | Auto 종료. 사이클 요약 저장, mission-ledger 업데이트 | 37 |
| `/stop` | 세션 스냅샷 저장 (`stop-state.md`). 다음 세션 복원용 | 63 |
| `/auto-auto-exit` | Auto-Auto 종료. Permission Broker 상태 확인 포함 | 57 |

### 5. Utility — 유틸리티 (3개)

| 스킬 | 설명 | 줄수 |
|------|------|------|
| `/context` | 최근 대화 20개 로딩, 맥락 파악 | 37 |
| `/context-search` | 대화 이력에서 키워드 검색 | 38 |
| `/fix-github-issue` | GitHub 이슈 분석 → 브랜치 → 수정 → PR 자동화 | 16 |

---

## Agent

| 에이전트 | 설명 |
|----------|------|
| `prd-github-issue-creator` | 요구사항 → PRD 문서화 → GitHub 이슈 자동 생성 |

---

## Hooks

| 훅 | 이벤트 | 설명 | 줄수 |
|----|--------|------|------|
| `permission-broker.py` | PermissionRequest | Auto-Auto 모드 권한 자동 판단 (ALLOW/DENY 리스트) | 144 |
| `pre-compact.py` | PreCompact | 컨텍스트 압축 전 상태 보존 처리 | 137 |

---

## settings.json

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/permission-broker.py",
            "timeout": 5
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/pre-compact.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

## 공유 인프라 & 의존성

### 서버
- **ai1**: `mayacrew@100.88.145.15` (모든 F1 서비스 호스트)
- **xapi**: `https://xapi.so` (port 7750)

### 필수 로컬 디렉토리
```
~/F1/
├── f1crew-mayacrew/     # Gateway 소스 (TypeScript)
├── f1crew-config/       # f1crew.json 설정
├── f1crew-workspace/    # 에이전트 워크스페이스
├── f1-fas/              # FAS 소스
├── f1-mas/              # MAS 소스
├── f1-nas/              # NAS 소스
├── f1-eventbus/         # EventBus
├── f1-logbus/           # LogBus
├── f1-vault/            # Vault
├── f1-configstore/      # ConfigStore
├── f1-backup/           # Backup
├── xapi/                # xapi 소스
├── starverse/           # STARVERSE
└── auto/
    └── rules.yml        # 자율주행 규칙 (모든 auto-* 공통)
```

### auto-archive (세션 간 상태 유지)
```
auto-archive/
├── mission-ledger.md    # 목표 추적 (모든 auto-* 공유)
├── stop-state.md        # 세션 스냅샷 (/stop 으로 생성)
├── auto-summary.md      # 자율주행 요약
├── task-state.md        # 태스크 상태 (모드 스킬 공유)
└── auto-*.md            # 각 auto 스킬별 히스토리
```

### MCP 서버
- `f1-infra`: ai1 서버 관리용 MCP 도구

### 커스텀 에이전트 (subagent)
- `deployer`: ai1 배포
- `log-analyzer`: 서버 로그 분석
- `code-reviewer`: 코드 리뷰

---

## 스킬 아키텍처 패턴

### Mode 스킬 공통 흐름
```
Boot → CLAUDE.md 로딩 → 서버 상태 체크 (SSH/xapi) → 대시보드 출력 → task-state.md 추적
```

### Auto 스킬 공통 흐름
```
rules.yml 로딩 → 도메인 문서 로딩 → 라이브 상태 관찰 →
stop-state.md 복원 → mission-ledger.md 로딩 →
[7-Phase 루프: Observe → Hypothesize → Design → Execute → Verify → Apply → Derive]
→ 아카이브 저장 → 안전 제약 준수
```

### 도구 우선순위
```
1. MCP f1-infra 도구
2. xapi HTTP 호출
3. SSH (fallback only)
```

---
---

# Part 2: Auto 스킬 제작 가이드

> 새로운 Auto 스킬을 만들 때 참고하는 설계 원칙, 템플릿, 팁 모음.

---

## 핵심 철학

Auto 스킬은 **과학적 방법론을 코드에 적용하는 자율 에이전트**다.
사용자 명령 없이 스스로 관찰 → 가설 → 실험 → 검증 루프를 돌린다.

핵심 원칙 6개:
```
1. 가설 없는 행동은 존재하지 않는다
2. 데이터가 가설을 이긴다 (확증편향 경계)
3. 실험은 가설보다 작아야 한다 (최소 단위)
4. 기록하지 않은 발견은 발견이 아니다
5. 틀린 가설도 가치 있다 (기각 사유가 다음 가설의 씨앗)
6. 한 사이클에 한 가설. 욕심 부리지 않는다
```

---

## Auto 스킬 구조 (6개 섹션)

모든 auto 스킬은 이 뼈대를 공유한다:

```
## 0. 부팅         ← 규칙 + 도메인 문서 + 라이브 상태 + 컨텍스트 복원
## 1. 탐구 범위     ← 이 스킬이 관찰/가설을 세울 수 있는 경계
## 2. 사이클 구조   ← 7-Phase + 가설 필수 필드 + 판정 규칙
## 3. 특화 제약     ← 도메인별 추가 제약 (base auto 위에)
## 4. 출력 형식     ← 사이클 리포트 포맷
## 5. 안전 제약     ← auto 공통 + 도메인 추가
## 6. 미션 지속성   ← mission-ledger + stop-state + interrupt 규칙
```

---

## 새 Auto 스킬 만들기: 스텝 바이 스텝

### Step 1: 이름 정하기

```
auto-{도메인}.md          ← 단일 시스템 탐구
auto-{도메인A}-{도메인B}.md ← 크로스 시스템 탐구
```

예시: `auto-fas.md`, `auto-gateway-xapi.md`, `auto-zero-debugging.md`

### Step 2: 부팅 섹션 작성

**필수 3블록**: 규칙 로드 → 도메인 로드 → 컨텍스트 복원

```markdown
## 0. 부팅

### 규칙 로드
1. `~/F1/auto/rules.yml` 읽기 — Auto 핵심 규칙

### {도메인} 도메인 로드
2. `~/F1/{project}/CLAUDE.md` — 프로젝트 개요
3. `~/F1/{project}/docs/주요문서.md` — 핵심 설계 문서
4. (xapi 라우터가 있으면) `~/F1/xapi/xapi/routers/{domain}.py`

### 라이브 상태 수집 (xapi 우선)
\```bash
XAPI="https://xapi.so"
curl -s $XAPI/{domain}/status | python3 -c "..."
\```

### Fallback: xapi 장애 시 SSH
\```bash
ssh mayacrew@100.88.145.15 '...'
\```

### 컨텍스트 복원
5. `<CWD>/auto-archive/auto-summary.md` 읽기 (없으면 생성)
6. `<CWD>/auto-archive/stop-state.md` 읽기 → 복원 후 삭제
7. `<CWD>/auto-archive/mission-ledger.md` 읽기
8. 오늘의 `auto-{도메인}-YYYY-MM-DD.md` 열기/생성
```

**팁**:
- 도메인 문서는 **읽는 순서가 중요**. 개요 → 아키텍처 → 운영 가이드 순
- 라이브 상태 수집에 `python3 -c "import sys,json; ..."` 원라이너로 핵심만 뽑기
- xapi 엔드포인트가 있으면 SSH 대신 무조건 xapi 우선 (속도 10배 차이)

### Step 3: 탐구 범위 정의

```markdown
## 1. 탐구 범위

### {도메인} 시스템 (핵심)
- **컴포넌트 A**: 무엇을 관찰할 수 있는지
- **컴포넌트 B**: 무엇이 개선 가능한지
- ...

### xapi ↔ {도메인} 통합 (있으면)
- 스키마 매핑 정확도
- 엔드포인트 커버리지
- 에러 핸들링
```

**팁**:
- 범위는 **구체적으로**. "전체 시스템" 같은 막연한 표현 금지
- xapi 연동이 있으면 별도 섹션으로 분리 — 크로스 시스템 가설의 씨앗

### Step 4: 사이클 구조 (보통 base를 참조)

간단한 경우:
```markdown
## 2. 사이클 구조
rules.yml의 7단계를 그대로 따른다:
**Observe** → **Hypothesize** → **Design** → **Execute** → **Verify** → **Apply** → **Derive**
```

심화 스킬 (auto-zero 같은 경우) — **가설 단계를 강화**:
```markdown
### Phase 2: 가설 (Hypothesize) — 심층 사고

#### 사고 프레임워크
1. 현상 분해 (Decompose) — 구성 요소 분리
2. 근인 추적 (Root Cause) — "왜?" 를 3번 반복
3. 구조적 패턴 (Structural Pattern) — 어떤 설계 결함인지
4. 레버리지 포인트 (Leverage Point) — 최소 변경 최대 효과 지점
5. 가설 정제 (Refine) — 반증 가능한 형태로

#### 추가 필드
| Impact | 시스템 전체 파급력 |
```

**팁**:
- base auto의 5필드(Claim/Basis/Prediction/Null/Risk)는 **항상 포함**
- 도메인 복잡도에 따라 **추가 필드**를 넣을 수 있음 (Impact, Side 등)
- 사고 프레임워크는 복잡한 시스템에만. 단순 서비스엔 오버킬

### Step 5: 특화 제약 추가

```markdown
## 3. 특화 제약
- **관찰은 xapi 우선**: SSH 대신 `curl https://xapi.so/{domain}/...`
- **코드 수정은 로컬에서만**: `~/F1/{project}/` (서버 직접 수정 금지)
- **{도메인 고유 제약}**: 예) "Gateway 호출 시 user 필드 필수"
- **배포**: `./deploy/deploy-ai1.sh`
```

**팁**:
- 도메인별로 "절대 하면 안 되는 것"을 명시 — 토큰 하드코딩, 프로덕션 쓰기 등
- 배포 경로가 있으면 정확히 기재

### Step 6: 출력 형식

```markdown
## 4. 출력 형식
\```
━━━ Auto×{Domain} Cycle #N ━━━━━━━━━━━━━━━━━━━━

[관찰] ...
[가설] Claim/Basis/Prediction/Null/Risk
[실험 설계] 실험/채택기준/기각기준/범위/되돌림
[실험 결과] ...원본 출력...
[검증] ✅|❌|⚠️|❓
[적용] ...변경 사항 또는 "적용 없음"...

→ 다음 가설: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\```
```

### Step 7: 미션 지속성 (복사 후 current_state만 수정)

```markdown
## 5. 미션 지속성

### 미션 원장 (Mission Ledger)
매 사이클 시작 전 `<CWD>/auto-archive/mission-ledger.md`를 읽고 갱신:

\```
mission_id: [세션ID-목표요약]
primary_goal: [현재 최상위 목표]
subgoals:
  - [하위 목표 1] — ✅|⬜
current_state:
  {도메인_고유_상태}: [값]     ← ★ 여기만 도메인에 맞게 수정
next_action: [딱 1개]
done_criteria: [완료 조건]
checkpoint: [마지막 검증 증거]
\```

### 인터럽트 안전 규칙
1. 에러 시에도 `next_action`을 변경하지 않는다
2. 트리아주 완료 후 원장의 `next_action`으로 복귀
3. 컨텍스트 압축 후 원장 재읽기
```

### Step 8: 마지막 줄

```markdown
$ARGUMENTS 가 있으면 해당 주제에 집중하고, 없으면 {도메인} 전체를 탐색합니다.
```

이 한 줄로 `/auto-{domain} 특정주제` 형태의 포커스 모드를 지원.

---

## 제작 팁 & 안티패턴

### DO (좋은 패턴)

| 팁 | 이유 |
|----|------|
| **rules.yml을 외부 파일로 분리** | 모든 auto-* 가 동일 규칙 참조. 규칙 변경 시 한 곳만 수정 |
| **xapi 엔드포인트 맵 테이블 포함** | 어떤 SSH 명령을 대체하는지 명확. 관찰 단계 속도 향상 |
| **stop-state.md 복원 로직 포함** | `/stop`으로 세션 중단 후 다음 세션에서 이어가기 |
| **mission-ledger.md 포함** | 컨텍스트 압축(compaction) 후에도 목표를 잃지 않음 |
| **출력 형식에 구분선(`━━━`) 사용** | 사이클 경계가 명확. 긴 세션에서 스크롤 시 가독성 |
| **Fallback SSH 블록 별도 분리** | xapi 장애 시 자동 폴백. 주 경로와 분리 |
| **`$ARGUMENTS` 지원** | 범용/포커스 모드 전환. 하나의 스킬로 두 가지 용도 |
| **판정 후 다음 행동 테이블** | Confirmed/Rejected/Partial/Inconclusive 각각 뭘 할지 명확 |
| **도메인별 current_state 필드** | FAS면 token_health, MAS면 personas_loaded 등 |

### DON'T (안티패턴)

| 안티패턴 | 문제점 |
|----------|--------|
| rules.yml 내용을 스킬 파일에 인라인 복사 | 규칙 변경 시 35개 파일 전부 수정해야 함 |
| 가설 없이 바로 코드 수정 | Auto의 존재 이유(과학적 방법론) 위반 |
| 관찰에서 SSH만 사용 | 느리고, 서버 부하. xapi가 있으면 xapi 우선 |
| 부팅에서 문서 전부 읽기 | 컨텍스트 낭비. 핵심 문서만 선별 |
| 안전 제약 섹션 생략 | 프로덕션 사고 위험. 최소한 base 제약은 복사 |
| "전체를 개선한다" 같은 범위 | 가설이 너무 넓어짐. 구체적 컴포넌트 단위로 |
| 아카이브 경로 안 적기 | 다음 세션에서 히스토리 못 찾음 |
| 10사이클 체크 빼먹기 | 무한 루프 위험. 비용/시간 낭비 |

---

## 심화: 크로스 도메인 Auto 스킬

`auto-gateway-xapi.md` 같이 **두 시스템의 경계**를 탐구하는 스킬:

### 추가 설계 포인트
1. **Side 필드 추가**: 가설이 어느 쪽 변경인지 (gateway / xapi / both)
2. **양쪽 문서 모두 로딩**: 부팅에서 두 프로젝트 문서 읽기
3. **엔드포인트 맵 + 코드 매핑**: "이 xapi 라우터가 gateway의 이 함수를 호출"
4. **통합 테스트 설계**: 단일 시스템 테스트 + 연동 테스트 분리

### 파일명 컨벤션
```
auto-{주체}-{대상}.md
     └ 변경이 주로 일어나는 쪽
```

---

## 심화: 진화 나침반 (Evolution Compass)

`auto-zero.md`에서 사용하는 4-Tier 우선순위:

```
Tier 1: 신뢰성 & 안정성  ← 장애 복구, 에러 차단 (최우선)
Tier 2: 에이전트 지능     ← 정확도, 품질, 의사결정
Tier 3: 효율성            ← 비용, 지연, 캐싱
Tier 4: 확장성            ← 새 채널, 스케일링, 통합
```

복잡한 시스템을 다루는 auto 스킬에 추가하면 가설 우선순위 판단에 도움.

---

## 심화: 사고 프레임워크 (Thinking Framework)

`auto-zero.md`에서 가설 단계를 강화하기 위해 사용:

```
1. 현상 분해 (Decompose)      — "이 현상은 A, B, C 요소로 구성된다"
2. 근인 추적 (Root Cause)      — "A가 이렇게 된 이유는? → 그 이유는? → 진짜 원인은?"
3. 구조적 패턴 (Pattern)       — "이것은 X 패턴의 결함/한계/부재 때문이다"
4. 레버리지 포인트 (Leverage)  — "여기를 바꾸면 연쇄적으로 A, B, C가 개선된다"
5. 가설 정제 (Refine)          — 반증 가능한 형태로 정리
```

단순 서비스 모니터링엔 불필요. **아키텍처 레벨 개선**을 다루는 스킬에만 추가.

---

## 완성 템플릿: 새 도메인용 Auto 스킬

아래를 복사하고 `{domain}`, `{Domain}`, `{project}` 를 치환하면 바로 사용 가능:

```markdown
Auto × {Domain} — {Domain} 시스템을 대상으로 자율주행 가설-검증 탐구를 시작합니다.

xapi 엔드포인트를 우선 활용하여 관찰/실험을 수행합니다.

---

## 0. 부팅

### 규칙 로드
1. `~/F1/auto/rules.yml` 읽기 — Auto 핵심 규칙

### {Domain} 도메인 로드
2. `~/F1/{project}/CLAUDE.md` — 프로젝트 개요
3. `~/F1/{project}/docs/ARCHITECTURE.md` — 핵심 설계 문서
4. `~/F1/xapi/xapi/routers/{domain}.py` — xapi 라우터 (있으면)

### 라이브 상태 수집 (xapi 우선)
\```bash
XAPI="https://xapi.so"
curl -s $XAPI/{domain}/status | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'healthy={d[\"healthy\"]}')
# 도메인별 핵심 메트릭 출력
"
\```

### Fallback: xapi 장애 시 SSH
\```bash
ssh mayacrew@100.88.145.15 '
  systemctl --user status {service} 2>/dev/null | grep -E "(●|Active:)"
  curl -s http://localhost:{port}/health
'
\```

### 컨텍스트 복원
5. `<CWD>/auto-archive/auto-summary.md` 읽기 (없으면 생성)
6. `<CWD>/auto-archive/stop-state.md` 읽기 — 복원 후 삭제
7. `<CWD>/auto-archive/mission-ledger.md` 읽기
8. 오늘의 `auto-{domain}-YYYY-MM-DD.md` 열기/생성

---

## 1. 탐구 범위

### {Domain} 시스템 (핵심)
- **컴포넌트 A**: 설명
- **컴포넌트 B**: 설명
- **컴포넌트 C**: 설명

### xapi ↔ {Domain} 통합
- 스키마 매핑 정확도
- 엔드포인트 커버리지
- 에러 핸들링

---

## 2. xapi 엔드포인트 맵

| 엔드포인트 | 용도 | 대체하는 SSH 패턴 |
|-----------|------|------------------|
| `GET /{domain}/status` | 전체 상태 | `ssh ai1 'curl localhost:{port}/status'` |
| `GET /{domain}/health` | 헬스체크 | `ssh ai1 'curl localhost:{port}/health'` |

---

## 3. 사이클 구조

rules.yml의 7단계를 그대로 따른다:
**Observe** → **Hypothesize** → **Design** → **Execute** → **Verify** → **Apply** → **Derive**

### 가설 필수 5필드
| Claim | Basis | Prediction | Null | Risk |

### 실험 설계 필수 항목
\```
실험: [방법]
채택 기준: [결과]
기각 기준: [결과]
범위: [{Domain} 내 어디까지]
되돌림: 가능|불가능
\```

### 판정
Confirmed → Apply → 다음 가설
Rejected → 분석 → 새 가설
Partial → 분리 → 세부 가설
Inconclusive → 실험 재설계

---

## 4. 특화 제약

- **관찰은 xapi 우선**: SSH 대신 `curl https://xapi.so/{domain}/...`
- **코드 수정은 로컬 `~/F1/{project}/`에서만** (서버 직접 수정 금지)
- **배포**: `./deploy/deploy-ai1.sh` → systemctl restart

---

## 5. 출력 형식

\```
━━━ Auto×{Domain} Cycle #N ━━━━━━━━━━━━━━━━━━━━

[관찰] ...현황 데이터...

[가설]
Claim: ...
Basis: ...
Prediction: ...
Null: ...
Risk: low|mid|high

[실험 설계]
실험: ...
채택 기준: ...
기각 기준: ...
범위: ...
되돌림: ...

[실험 결과]
...원본 출력...

[검증] ✅ Confirmed | ❌ Rejected | ⚠️ Partial | ❓ Inconclusive
예측: ...
실제: ...
설명: ...

[적용]
...변경 사항 또는 "적용 없음"...

→ 다음 가설: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\```

---

## 6. 안전 제약

Auto 공통 제약 + {Domain} 추가:
- 서비스 중단/재시작 금지
- 데이터 삭제 금지
- 10사이클 경과 시 사용자에게 확인
- 사용자 중단 요청 시 즉시 상태 요약 후 중단

---

## 미션 지속성 (Mission Persistence)

### 미션 원장 (Mission Ledger)
매 사이클 시작 전 `<CWD>/auto-archive/mission-ledger.md`를 읽고, 완료 후 갱신:

\```
mission_id: [세션ID-목표요약]
primary_goal: [현재 최상위 목표]
subgoals:
  - [하위 목표 1] — ✅|⬜
current_state:
  {domain}_health: [상태]
  {domain}_metrics: [핵심 수치]
next_action: [딱 1개]
done_criteria: [완료 조건 — 관찰 가능한 증거]
checkpoint: [마지막 검증 증거]
\```

### 인터럽트 안전 규칙
1. 에러 시에도 `next_action`을 변경하지 않는다
2. 트리아주 완료 후 원장의 `next_action`으로 복귀
3. 컨텍스트 압축 후 원장 재읽기

---

## 도구 & 에이전트

> 공통 도구(MCP f1-infra, 전문 에이전트)는 `/auto` 참조. 우선순위: MCP → xapi → SSH.

---

$ARGUMENTS 가 있으면 해당 주제에 집중하고, 없으면 {Domain} 전체를 탐색합니다.
```

---

## rules.yml 전문 (모든 Auto 스킬의 공통 규칙)

```yaml
# Auto Mode Rules
# 자율주행 가설-검증 탐구 시스템의 핵심 규칙

# ─────────────────────────────────────────────
# 1. 사이클 구조 (Cycle Structure)
# ─────────────────────────────────────────────
cycle:
  phases:
    - observe     # 데이터 수집, 현상 포착
    - hypothesize # 가설 수립 (반드시 falsifiable)
    - design      # 실험 설계 (판정 기준 사전 정의)
    - execute     # 실험 실행 (최소 단위)
    - verify      # 결과 대조, 가설 판정
    - apply       # 검증된 것만 적용 + 기록
    - derive      # 다음 가설 도출
  skip_allowed: false

# ─────────────────────────────────────────────
# 2. 가설 품질 규칙 (Hypothesis Quality)
# ─────────────────────────────────────────────
hypothesis:
  required_fields:
    - claim       # "X이면 Y이다" 형태의 주장
    - basis       # 어떤 관찰/데이터에서 도출했는지
    - prediction  # 가설이 맞다면 실험에서 관찰될 구체적 결과
    - null        # 가설이 틀리다면 관찰될 결과 (귀무가설)
    - risk        # 이 가설이 틀렸을 때의 영향도 (low/mid/high)
  quality_checks:
    - falsifiable: true
    - specific: true
    - one_variable: true
    - no_confirmation_bias: true

# ─────────────────────────────────────────────
# 3. 실험 설계 규칙 (Experiment Design)
# ─────────────────────────────────────────────
experiment:
  required_fields:
    - method
    - success_criteria:
        accept: ""
        reject: ""
        partial: ""
    - scope
    - reversible
  constraints:
    - minimum_viable: true
    - no_side_effects: true
    - read_before_write: true
    - one_at_a_time: true

# ─────────────────────────────────────────────
# 4. 검증 판정 규칙 (Verification Judgment)
# ─────────────────────────────────────────────
verification:
  verdicts:
    confirmed:
      action: "원인 확정, 해결책 도출, apply phase로"
    rejected:
      action: "왜 틀렸는지 분석 → 새 가설 도출"
    partial:
      action: "맞는 부분/틀린 부분 분리 → 세분화된 가설 2개로 분기"
    inconclusive:
      action: "실험 재설계 (같은 가설, 다른 방법)"
  required_records:
    - raw_data
    - expected_vs_actual
    - explanation
    - next_direction

# ─────────────────────────────────────────────
# 5. 적용 규칙 (Apply Rules)
# ─────────────────────────────────────────────
apply:
  code_change_allowed:
    - confirmed
    - partial
  checklist:
    - hypothesis_verified: true
    - change_is_minimal: true
    - rollback_possible: true
    - tests_pass: true
    - documented: true

# ─────────────────────────────────────────────
# 6. 아카이브 규칙 (Archive Rules)
# ─────────────────────────────────────────────
archive:
  location: "<CWD>/auto-archive/"
  files:
    daily: "auto-YYYY-MM-DD.md"
    summary: "auto-summary.md"

# ─────────────────────────────────────────────
# 7. 안전 제약 (Safety Constraints)
# ─────────────────────────────────────────────
safety:
  forbidden:
    - service_restart: "systemctl stop/restart 금지"
    - data_deletion: "rm, DROP, DELETE 등 파괴적 명령 금지"
    - force_push: "git push --force 금지"
    - unverified_deploy: "검증 안 된 코드 배포 금지"
  caution:
    - production_api_calls: "프로덕션 API는 읽기만"
    - config_changes: "설정 변경 시 백업 먼저"
    - cost_awareness: "API 호출 비용 주의"
  interrupt:
    - user_request: "즉시 현재 상태 요약 후 중단"
    - max_cycles_warning: 10

# ─────────────────────────────────────────────
# 8. 메타 규칙 (Meta Rules)
# ─────────────────────────────────────────────
meta:
  - "가설 없는 행동은 존재하지 않는다"
  - "데이터가 가설을 이긴다 (확증편향 경계)"
  - "실험은 가설보다 작아야 한다 (최소 단위)"
  - "기록하지 않은 발견은 발견이 아니다"
  - "틀린 가설도 가치 있다 (기각 사유가 다음 가설의 씨앗)"
  - "한 사이클에 한 가설. 욕심 부리지 않는다"

# ─────────────────────────────────────────────
# 9. 도구 & 에이전트 (Tools & Agents)
# ─────────────────────────────────────────────
tools:
  mcp:
    f1-infra:
      priority: "SSH보다 우선 사용"
      tools:
        - server_status
        - server_logs
        - service_health
        - gateway_errors
        - openclaw_log
  agents:
    deployer:
      trigger: "Apply 후 배포 필요 시"
    log-analyzer:
      trigger: "Observe에서 에러 다수 발견 시"
    code-reviewer:
      trigger: "Apply 전 변경 검증 시"
  policy:
    - "MCP 도구 > SSH 명령어"
    - "복잡한 분석은 전문 에이전트에게 위임"
```

---

## 보조 스킬: /stop, /auto-out

Auto 세션 관리를 위한 필수 보조 스킬. 새 Auto 스킬 만들 때 이것들이 이미 있어야 작동함.

### /stop — 세션 스냅샷 저장

`stop-state.md`에 현재 상태를 저장하고, 다음 `/auto-*` 실행 시 자동 복원.

```markdown
# Stop State — {YYYY-MM-DD HH:MM}

## 모드
{실행 중이던 모드명}

## 마지막 사이클
{사이클 번호}

## 진행 중이던 작업
{중단 시점의 구체적 작업}

## 다음에 할 것
{다음 세션에서 이어갈 작업 목록}

## 미커밋 변경
{git status --short 결과}

## 주요 파일
{수정한 핵심 파일 경로들}
```

### /auto-out — Auto 종료

사이클 요약 아카이브 + mission-ledger 갱신 + 미커밋 확인 + 종료 보고.
