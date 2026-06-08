# AI Usage Report

## AI Tools Used (사용한 AI 도구)

- **Claude (Claude Code)** — 기술 명세서를 바탕으로 한 초기 코드 생성, 컴포넌트 구현, 디버깅, 문서 초안 작성.

## Tasks Supported by AI (AI가 도운 작업)

- 서비스 콘셉트와 사용자 시나리오를 기술 명세서로 구체화
- React + TypeScript + Vite 프로젝트 스캐폴딩 및 Tailwind 디자인 토큰 설정
- 데이터 모델(`types.ts`)과 Zustand store 구조 설계
- 저장 백엔드 추상화 계층(로컬 ↔ Firebase 자동 전환) 설계 및 구현
- 역할 자동 분배 · 회의시간 추천 등 결정적 알고리즘 구현
- 각 기능 패널(팀원/역할/회의시간/할 일/대시보드) UI 컴포넌트 생성
- 빌드 오류(TypeScript 프로젝트 참조, `import.meta.env` 타입) 디버깅
- README / .env.example / 본 문서 초안 작성

## Example Prompts (대표 프롬프트)

1. "아래 TeamFlow 기술 명세서를 읽고 구현 순서대로 단계별로 구현해 줘. 각 단계가 끝나면 동작을 확인할 수 있는 상태로 만들어 줘."
2. "Firebase가 뭔지 모르겠어. localStorage로도 동작하면서, 나중에 Firebase 값을 넣으면 자동으로 클라우드 실시간 공유로 전환되게 만들어 줘."
3. "회의시간 그리드에서 셀을 드래그하면 연속으로 칠해지도록 해 줘."

## AI Outputs We Modified / Verified (우리가 수정·검증한 부분)

- **저장 백엔드 설계 변경**: 명세서는 Firestore만 가정했으나, 처음 사용자도 설정 없이 바로 쓰도록 `ProjectBackend` 인터페이스 + 로컬/Firebase 두 구현으로 분리하고 환경변수로 자동 선택하게 함 (`src/lib/backend/`).
- **샘플 데이터 담당자 매핑**: 할 일의 `assigneeId`가 생성 전 멤버 ID를 알 수 없는 문제를 발견하고, 멤버 생성 후 이름→ID로 매핑하도록 `loadSampleData`를 수정 (`src/store/useStore.ts`).
- **드래그 토글 로직 검증**: 그리드에서 단순 토글이 드래그 중 깜빡이는 문제를 잡기 위해, 처음 누른 셀 상태로 칠/지움 모드를 고정하도록 구현 (`AvailabilityGrid.tsx`).
- **타이브레이크 정렬**: 추천 회의시간이 인원수 동률일 때 요일·시간 순서가 유지되도록 보조 정렬 키 추가 (`src/lib/meetingTime.ts`).
- **빌드 설정 수정**: `tsconfig` 프로젝트 참조와 `import.meta.env` 타입 오류를 직접 진단하고 `vite-env.d.ts`로 해결.
- **동기 방출(TDZ) 버그 수정**: 샘플 프로젝트의 멤버 ID를 모으는 임시 구독에서, 로컬 백엔드가 `subscribe()` 도중 **동기적으로** 첫 스냅샷을 방출하는 바람에 `unsub` 변수가 초기화되기 전에 호출되어(Temporal Dead Zone) 할 일이 하나도 생성되지 않는 문제를 발견·수정 (`useStore.ts`의 `collectMemberIds`, `settled` 플래그 도입).
- **샘플 데이터 비파괴 전환**: 기존엔 "샘플 불러오기"가 현재 프로젝트를 초기화(clearAll)해 작업물이 사라지던 문제를 발견하고, 샘플을 **별도의 새 프로젝트**로 생성하도록 설계 변경 (`createSampleProject`).
- **경량 이름 로그인 + 다중 프로젝트 홈**: 한 학생이 여러 과제를 오갈 수 있도록 이름 기반 식별과 "내 프로젝트" 목록(진행률 카드)을 추가. 사용자별 프로젝트 목록을 백엔드 인터페이스(`addUserProject`/`getUserProjects`)로 추상화해 로컬·Firebase 모두에서 동작하게 함.
- **팀 채팅 추가**: `messages` 서브컬렉션과 `onMessages` 구독을 백엔드 인터페이스에 더하고, 보낸 사람 기준 좌/우 말풍선 UI 구현 (`ChatPanel.tsx`).
- **이름 + PIN 경량 인증 추가**: "이름만 치면 누구나 그 사람으로 로그인되는" 사칭 문제를 직접 발견하고, 4자리 PIN을 도입. PIN은 평문 대신 Web Crypto SHA-256(이름 salt) 해시로 저장하고(`src/lib/hash.ts`), 백엔드 인터페이스에 `getUserPinHash`/`setUserPinHash`를 추가해 로컬·Firebase 양쪽에서 동작하게 함. **AI가 "진짜 보안"으로 오해하지 않도록**, 규칙이 열려 있으면 4자리 해시는 무차별 대입 가능하다는 한계를 우리가 직접 판단해 코드 주석·README에 한계점으로 명시(운영 시 Firebase Auth 필요). 기존 사용자(`pinHash` 없음)는 다음 로그인 때 입력한 PIN으로 자연스럽게 등록되도록 마이그레이션 경로 설계.

## Core Files We Can Explain (설명할 수 있는 핵심 파일)

- `src/store/useStore.ts` — 상태 관리와 데이터 흐름의 중심. 백엔드 구독 결과를 상태에 미러링하고 모든 변경 액션을 정의.
- `src/lib/backend/index.ts` & `local.ts` & `firebase.ts` — 저장소 추상화. 환경변수 유무로 로컬/클라우드를 선택하는 핵심 아키텍처.
- `src/lib/roleAssign.ts` — 역할 자동 분배 알고리즘 (팀원 수와 역할 수가 달라도 균형 배정).
- `src/lib/meetingTime.ts` — 슬롯별 가능 인원을 집계해 추천 시간 Top N을 계산.
- `src/components/meeting/AvailabilityGrid.tsx` — 드래그로 가능 시간을 칠하고 겹침을 히트맵으로 시각화.

## What We Learned (배운 점)

- AI가 만든 코드도 **엣지케이스(샘플 데이터의 ID 의존성, 드래그 상태 관리)**는 직접 검토·수정해야 한다는 것을 배웠다.
- 명세서의 가정(Firestore 전용)을 그대로 따르기보다, **실사용자(처음 쓰는 사람)** 관점에서 "설정 없이도 동작" 요구를 추가해 인터페이스로 추상화하는 설계 판단을 직접 내렸다.
- 구독 기반 단일 진실 공급원 구조에서 **쓰기 → 구독 → 상태 갱신**이라는 단방향 데이터 흐름이 화면 동기화를 단순하게 만든다는 것을 이해했다.
