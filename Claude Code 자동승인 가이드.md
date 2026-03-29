# Claude Code 권한 자동승인 가이드

> Claude Code에서 도구 실행 시 뜨는 "Allow / Deny" 프롬프트를 자동으로 처리하는 방법

---

## 문제 상황

Claude Code가 도구(Bash, Edit, Write 등)를 실행하려 할 때 아래와 같은 프롬프트가 뜬다:

```
Claude wants to execute: ssh mayacrew@100.88.145.15 "systemctl status mas"

  1. Allow once
  2. Allow always for this session
  3. Deny

Do you want to proceed?
```

자율주행(Auto) 모드에서는 이게 매번 뜨면 작업 흐름이 끊긴다.

---

## 해결: 2계층 자동승인 시스템

두 가지를 함께 설정하면 대부분의 프롬프트가 사라진다.

### 계층 1: settings.local.json (정적 허용목록)

Claude Code가 도구를 실행하기 **전에** 먼저 이 목록을 확인한다.
목록에 있으면 프롬프트 없이 즉시 실행.

### 계층 2: Permission Broker Hook (동적 정책 엔진)

계층 1에서 안 잡힌 경우, Hook이 실행되어 ALLOW/DENY를 판정한다.
Hook이 `{"behavior": "allow"}`를 반환하면 프롬프트 없이 실행.

```
도구 호출 요청
    │
    ├─ settings.local.json의 allow 목록에 있음? → ✅ 즉시 실행
    │
    ├─ settings.local.json의 deny 목록에 있음? → ❌ 즉시 차단
    │
    └─ 둘 다 아님 → PermissionRequest Hook 발동
         │
         ├─ permission-broker.py의 DENY 패턴 매치? → ❌ 차단
         │
         └─ DENY 안 걸림 → ✅ 자동 승인
```

**결과: DENY 패턴에 걸리는 극소수만 차단, 나머지 전부 자동 승인**

---

## 설정 방법

### Step 1: Permission Broker 스크립트 생성

파일: `~/.claude/hooks/permission-broker.py`

```python
#!/usr/bin/env python3
"""Permission Broker v2 — Claude Code PermissionRequest Hook"""

import json, os, re, sys
from datetime import datetime
from pathlib import Path
from typing import List

# ═══════════════════════════════════════════
# 차단할 위험 패턴 (이것만 막고, 나머지 전부 허용)
# ═══════════════════════════════════════════

BASH_DENY: List[str] = [
    # 시스템 파괴
    r"\brm\s+-rf\s+/(?!\w)",           # rm -rf /
    r"^(mkfs|fdisk|dd\s+if=)\b",       # 디스크 포맷
    r"\b>\s*/dev/sd",                   # 디스크 직접 쓰기
    r"^(shutdown|reboot|halt|poweroff)\b",

    # Git 파괴적 명령
    r"git\s+push\s+.*--force\b",        # force push
    r"git\s+reset\s+--hard\s+origin",   # remote hard reset
    r"git\s+clean\s+-[fd].*-f",         # force clean

    # 크레덴셜 노출
    r"cat.*(\.env|credentials|secrets|password)",
    r"echo.*ANTHROPIC_API_KEY",
]

# ═══════════════════════════════════════════
# 로깅 (선택사항, 디버깅용)
# ═══════════════════════════════════════════

LOG_FILE = Path.home() / ".claude" / "hooks" / "broker.log"
MAX_LOG_LINES = 500

def _log(action: str, tool: str, detail: str) -> None:
    try:
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {action:5s} {tool}: {detail[:120]}\n"
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(line)
        # 500줄 초과 시 300줄만 유지
        try:
            lines = LOG_FILE.read_text().splitlines()
            if len(lines) > MAX_LOG_LINES:
                LOG_FILE.write_text("\n".join(lines[-300:]) + "\n")
        except Exception:
            pass
    except Exception:
        pass

# ═══════════════════════════════════════════
# 엔진
# ═══════════════════════════════════════════

def _matches(patterns: List[str], text: str) -> bool:
    return any(re.search(p, text) for p in patterns)

def _respond(behavior: str, message: str = "") -> None:
    decision = {"behavior": behavior}
    if message:
        decision["message"] = message
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PermissionRequest",
            "decision": decision,
        }
    }))

def main() -> int:
    raw = sys.stdin.read().strip()
    if not raw:
        return 0
    try:
        event = json.loads(raw)
    except json.JSONDecodeError:
        return 0

    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input") or {}

    # Bash 명령
    if tool == "Bash":
        cmd = (tool_input.get("command") or "").strip()
        if not cmd:
            return 0
        first_line = cmd.split("\n")[0].strip()
        if _matches(BASH_DENY, cmd) or _matches(BASH_DENY, first_line):
            _log("DENY", "Bash", first_line)
            _respond("deny", f"[broker] Blocked: {first_line[:80]}")
            return 0
        _log("ALLOW", "Bash", first_line)
        _respond("allow")
        return 0

    # 그 외 모든 도구 → 자동 승인
    detail = tool_input.get("file_path", str(tool_input)[:100])
    _log("ALLOW", tool, detail)
    _respond("allow")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

### Step 2: settings.json에 Hook 등록

파일: `~/.claude/settings.json`

기존 내용에 `hooks` 섹션을 추가한다:

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
    ]
  }
}
```

| 필드 | 설명 |
|------|------|
| `matcher` | `""` = 모든 도구에 적용. 특정 도구만 걸려면 `"Bash"` 등 지정 |
| `command` | Hook 스크립트 경로 |
| `timeout` | 5초 내 응답 없으면 Hook 무시 (사용자에게 프롬프트 표시) |

### Step 3: settings.local.json에 허용목록 설정

파일: `~/.claude/settings.local.json`

이 파일은 Hook보다 **먼저** 평가된다. 여기에 자주 쓰는 명령을 넣으면 Hook 호출 자체를 건너뛴다.

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "Write",
      "NotebookEdit",
      "WebSearch",
      "WebFetch(*)",
      "Bash(git *)",
      "Bash(gh *)",
      "Bash(ls*)",
      "Bash(pwd*)",
      "Bash(cat*)",
      "Bash(head*)",
      "Bash(tail*)",
      "Bash(find*)",
      "Bash(echo*)",
      "Bash(mkdir*)",
      "Bash(cp*)",
      "Bash(mv*)",
      "Bash(chmod*)",
      "Bash(python3*)",
      "Bash(python*)",
      "Bash(node*)",
      "Bash(npm*)",
      "Bash(bun*)",
      "Bash(pytest*)",
      "Bash(make*)",
      "Bash(curl*)",
      "Bash(ssh*)",
      "Bash(scp*)",
      "Bash(docker*)",
      "Bash(systemctl*)",
      "Bash(journalctl*)",
      "Bash(rm *)",
      "Bash(jq*)",
      "Bash(grep*)",
      "Bash(rg*)",
      "Bash(sed*)",
      "Bash(awk*)",
      "Bash(bash*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(mkfs*)",
      "Bash(fdisk*)",
      "Bash(dd if=*)",
      "Bash(shutdown*)",
      "Bash(reboot*)",
      "Bash(halt*)",
      "Bash(poweroff*)"
    ]
  }
}
```

**허용목록 패턴 문법:**
- `"Read"` — Read 도구 전체 허용
- `"Bash(git *)"` — `git`으로 시작하는 모든 Bash 명령 허용
- `"Bash(ssh*)"` — `ssh`로 시작하는 모든 Bash 명령 허용
- `"WebFetch(*)"` — 모든 URL에 대한 WebFetch 허용
- `*`는 와일드카드 (글로브 패턴)

**defaultMode 옵션:**
| 모드 | 동작 |
|------|------|
| `"ask"` | 매번 물어봄 (기본값) |
| `"acceptEdits"` | 파일 수정은 자동 허용, Bash는 목록 기준 |
| `"bypassPermissions"` | 전부 자동 허용 (**비권장**, 위험) |

---

## 설정 파일 위치 정리

| 파일 | 위치 | 역할 |
|------|------|------|
| `settings.json` | `~/.claude/settings.json` | Hook 등록 (전역) |
| `settings.local.json` | `~/.claude/settings.local.json` | 정적 허용/차단 목록 |
| `permission-broker.py` | `~/.claude/hooks/permission-broker.py` | 동적 정책 엔진 |
| `broker.log` | `~/.claude/hooks/broker.log` | 판정 로그 (디버깅용) |

---

## 동작 확인

### 1. Hook 상태 테스트

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"echo hello"}}' | python3 ~/.claude/hooks/permission-broker.py
```

정상 응답:
```json
{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}
```

### 2. DENY 테스트

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | python3 ~/.claude/hooks/permission-broker.py
```

차단 응답:
```json
{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"deny","message":"[broker] Blocked: rm -rf /"}}}
```

### 3. 로그 확인

```bash
tail -20 ~/.claude/hooks/broker.log
```

출력 예시:
```
[14:32:01] ALLOW Bash: git status
[14:32:03] ALLOW Edit: /Users/juno/project/src/main.py
[14:32:05] DENY  Bash: cat ~/.env
[14:32:07] ALLOW Bash: ssh mayacrew@100.88.145.15 "systemctl status mas"
```

---

## 커스터마이즈

### 새 명령을 자동승인에 추가하려면

**방법 A: settings.local.json에 추가** (빠름, 재시작 불필요)

```json
"allow": [
    "Bash(새명령*)",
    ...
]
```

**방법 B: permission-broker.py 수정** (더 세밀한 regex 가능)

DENY 목록에서 제외하면 자동으로 ALLOW된다. (기본이 전부 허용)

### 특정 명령을 차단하려면

**방법 A: settings.local.json의 deny에 추가**

```json
"deny": [
    "Bash(위험명령*)",
    ...
]
```

**방법 B: permission-broker.py의 BASH_DENY에 regex 추가**

```python
BASH_DENY: List[str] = [
    ...
    r"새로운\s+위험\s+패턴",  # 추가
]
```

---

## 트러블슈팅

### 프롬프트가 계속 뜨는 경우

1. **Hook 등록 확인**: `cat ~/.claude/settings.json`에서 `PermissionRequest` 섹션 확인
2. **스크립트 실행 권한**: `chmod +x ~/.claude/hooks/permission-broker.py`
3. **Python3 경로**: `which python3`로 경로 확인
4. **timeout 초과**: Hook이 5초 안에 응답하지 못하면 프롬프트로 폴백됨
5. **JSON 파싱 에러**: `settings.json`과 `settings.local.json`의 JSON 문법 검증

### Claude Code 재시작 필요?

- `settings.local.json` 수정: **재시작 불필요** (즉시 반영)
- `settings.json` 수정: **재시작 필요** (`claude` 종료 후 다시 시작)
- `permission-broker.py` 수정: **재시작 불필요** (매 호출마다 실행됨)

---

## auto-auto 모드 사용법

위 설정이 완료되면 Claude Code에서:

```
/auto-auto
```

이렇게 입력하면 Permission Broker 기반 완전 자율주행이 시작된다.
모든 도구 호출이 자동으로 승인/차단되어 사용자 개입 없이 작업이 진행된다.
