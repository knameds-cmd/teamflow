# TeamFlow 메인 코드 분석 (팀원용)

> 이 문서는 **팀원 모두가 코드를 이해하고 발표 Q&A에서 직접 설명할 수 있도록** 만든 분석 자료입니다.
> 과제 명세(*AI-Assisted Service Development*)의 **9. Individual Understanding Check**(각자 자신의 기여·파일·데이터 흐름을 설명),
> **8. 핵심 코드 파일 설명**, **6.3 기술 보고서(System Architecture / Implementation Details)** 항목에 대응합니다.
>
> 읽는 법: 먼저 **1~4장(큰 그림)**을 다 같이 읽고, 그다음 **5장(파일별 상세)**에서 본인이 발표에서 맡을 파일을 정해 깊게 보세요.
> 마지막 **8장(예상 질문)**으로 셀프 점검하면 됩니다.

---

## 1. 서비스 한 줄 요약

**TeamFlow** = 대학생 팀플(팀 프로젝트)에서 흩어지기 쉬운 정보 — **팀원 · 역할 · 회의시간 · 할 일 · 진행률 · 마감일(D-Day) · 팀 채팅** — 을 **한 화면에 모아 실시간으로 함께 보는** 웹 서비스.

- **문제**: 역할 분담은 카톡, 일정은 따로, 할 일은 머릿속 → "누가·무엇을·언제까지" 하는지 불투명, 마감 직전 몰림.
- **타깃 사용자**: 학기 중 팀 프로젝트를 진행하는 대학생.
- **입력 → 출력**: 사용자가 팀원/가능시간/할 일을 입력 → 시스템이 **역할 자동 분배·회의시간 추천·진행률 집계**를 계산해 보여줌.
- **핵심 가치**: 초대 코드 하나로 팀원이 같은 데이터를 **실시간**으로 보고, 한 명이 바꾸면 모두의 화면이 즉시 갱신.

> ⚠️ **중요(설계 결정)**: 이 서비스는 **LLM/AI API를 쓰지 않습니다.** 역할 분배·회의시간 추천은 모두 **클라이언트의 결정적(deterministic) 알고리즘**입니다. → 운영 비용 0원, 출력이 항상 **설명 가능**(발표에서 "왜 이 결과인지" 코드로 증명 가능). 명세의 "AI를 도구로 쓰되 시스템은 너희가 책임지고 설명하라"는 원칙에 부합.

---

## 2. 전체 아키텍처 (한눈에)

```
┌─────────────────────────────────────────────────────────────┐
│                         UI (React 컴포넌트)                   │
│  LoginScreen · HomeScreen · Header/TabNav · 각 기능 Panel     │
└───────────────▲───────────────────────────┬─────────────────┘
                │ 상태 구독(useStore 읽기)    │ 사용자 동작(액션 호출)
                │                            ▼
┌───────────────┴───────────────────────────────────────────────┐
│              Zustand Store  (src/store/useStore.ts)            │
│   - 앱의 모든 상태(멤버/할일/메시지/로그인/홈목록)를 보관       │
│   - 모든 "동작"(액션)을 정의: 액션은 backend에 "쓰기"만 함      │
└───────────────▲───────────────────────────┬───────────────────┘
                │ 구독 스냅샷(읽기)           │ 쓰기(create/add/update…)
                │                            ▼
┌───────────────┴───────────────────────────────────────────────┐
│        저장 백엔드 추상화  (src/lib/backend/)                  │
│   ProjectBackend 인터페이스 ── index.ts가 .env로 골라줌        │
│        ├─ local.ts     : localStorage (설정 0, 기본)          │
│        └─ firebase.ts  : Firestore (실시간 클라우드 공유)      │
└───────────────────────────────────────────────────────────────┘
```

**가장 중요한 데이터 흐름(외워두기):**

```
사용자 동작 → store 액션 → backend에 "쓰기"
                                  ↓
                       backend가 변경을 감지(구독)
                                  ↓
                       store가 새 데이터로 상태를 "미러링"
                                  ↓
                       구독 중인 모든 화면(나 + 팀원)이 자동 갱신
```

**핵심 원칙: 단일 진실 공급원(Single Source of Truth).**
UI는 절대 데이터를 직접 고치지 않는다. 항상 **(1) backend에 쓰고 → (2) 구독으로 돌아온 결과를 상태에 반영**한다. 그래서 "내가 바꾼 것"과 "팀원이 바꾼 것"이 똑같은 경로로 화면에 반영되어, 실시간 동기화가 자연스럽게 된다.

---

## 3. 기술 스택과 선택 이유

| 영역 | 기술 | 왜 골랐나 |
|---|---|---|
| UI | **React 18 + TypeScript** | 컴포넌트 단위 개발 + 타입으로 버그 예방 |
| 빌드 | **Vite 6** | 빠른 개발 서버(HMR), 설정 간단 |
| 스타일 | **Tailwind CSS 3** | 클래스로 빠르게 디자인, 다크모드(`dark:`) 내장 |
| 상태관리 | **Zustand 5 (+persist)** | Redux보다 단순. 스토어 하나로 상태+액션 관리, 로그인/코드/다크모드를 localStorage에 자동 저장 |
| 저장소 | **localStorage ↔ Firebase Firestore** | 설정 없이 바로 켜지고(local), `.env` 채우면 실시간 클라우드로 전환 |
| 날짜 | **dayjs** | D-Day 계산 (가벼운 날짜 라이브러리) |
| 아이콘/알림 | **lucide-react / react-hot-toast** | 아이콘, 토스트 알림 |
| 배포 | **Vercel** | `git push` 또는 CLI로 즉시 배포 |

---

## 4. 폴더 구조

```
src/
├── types.ts                  # 데이터 모델(타입)의 "사전". 모든 파일이 여기 타입을 가져다 씀
├── store/useStore.ts         # ★ 두뇌. 상태 + 모든 액션 + 구독→상태 미러링
├── lib/
│   ├── backend/              # ★ 저장 추상화 (로컬 ↔ Firebase)
│   │   ├── types.ts          #   ProjectBackend 인터페이스(규약)
│   │   ├── local.ts          #   localStorage 구현
│   │   ├── firebase.ts       #   Firestore 구현
│   │   └── index.ts          #   .env 보고 둘 중 하나 선택
│   ├── firebase.ts           # Firebase 앱/DB 초기화 + hasFirebaseConfig
│   ├── roleAssign.ts         # ★ 역할 자동 분배 알고리즘
│   ├── meetingTime.ts        # ★ 회의시간 추천 알고리즘
│   ├── dday.ts               # D-Day / 마감 임박 계산
│   ├── colors.ts             # 이름 → 아바타 색
│   ├── hash.ts               # PIN 해시(SHA-256)
│   └── projectCode.ts        # 6자리 초대 코드 생성/검증
├── components/
│   ├── auth/LoginScreen.tsx  # 이름 + PIN 로그인
│   ├── home/HomeScreen.tsx   # 내 프로젝트 목록(여러 과제)
│   ├── layout/               # Header, TabNav
│   ├── members/ roles/ meeting/ todos/ dashboard/ chat/  # 기능별 패널
│   └── common/               # EmptyState, ConfirmDialog, Avatar 등 공용
├── sampleData.ts             # 발표 데모용 샘플(별도 예시 프로젝트로 생성)
└── App.tsx                   # 3단계 라우팅(로그인→홈→프로젝트) + 레이아웃
```

★ 표시 = **발표에서 "핵심 코드 파일"로 설명하기 좋은 파일**.

---

## 5. 핵심 파일별 상세 분석

### 5.1 `src/types.ts` — 데이터 모델 (모든 것의 출발점)

앱에서 다루는 데이터의 "모양"을 TypeScript 타입으로 정의한다. 다른 모든 파일이 여기 타입을 import 한다.

- `Member` : `{ id, name, color, roles[], availability[], createdAt }` — 팀원 한 명.
- `Todo` : `{ id, title, assigneeId, dueDate, completed, createdAt }` — 할 일.
- `ProjectMeta` : `{ projectName, projectDeadline, createdAt }` — 프로젝트 정보.
- `Message` : `{ id, author, text, createdAt }` — 채팅 메시지.
- 상수: `ROLES`(발표/PPT/자료조사/보고서/일정관리), `DAYS`(월~일), `TIMES`(09:00~22:00).
- `SlotKey` : `` `${Day}-${Time}` `` 형식의 **템플릿 리터럴 타입**. 예) `"수-18:00"`. 회의 가능 시간 한 칸을 문자열 하나로 표현 → 배열에 담고 비교하기 쉬움.

**설명 포인트**: "왜 availability를 `SlotKey[]`(문자열 배열)로?" → 2차원 격자를 객체로 들고 다니는 것보다, `"수-18:00"` 같은 키 배열이 저장·비교·집계가 단순하기 때문.

---

### 5.2 `src/lib/backend/` — 저장 백엔드 추상화 ★ (이 프로젝트의 설계 핵심)

명세서 초안은 Firestore만 가정했지만, **처음 쓰는 사람도 설정 없이 바로 켜지게** 하려고 저장소를 **인터페이스로 추상화**했다. store는 "어떤 저장소인지" 전혀 모르고 인터페이스만 호출한다.

**`types.ts` (인터페이스 = 규약)**
```ts
export interface ProjectBackend {
  readonly mode: 'firebase' | 'local';
  createProject(code, name); projectExists(code);
  subscribe(code, handlers): Unsubscribe;          // 실시간 구독
  addMember/updateMember/deleteMember(...);
  addTodo/updateTodo/deleteTodo(...);
  addMessage(...);                                  // 채팅
  bulkSetMembers/bulkSetTodos/clearAll(...);        // 샘플/초기화
  addUserProject/getUserProjects(...);              // 내 프로젝트 목록
  getUserPinHash/setUserPinHash(...);               // 간단 PIN 인증
  getProjectStats(...);                             // 홈 카드 통계
}
```

**`index.ts` (선택자)** — 단 한 줄이 전부:
```ts
export const backend = hasFirebaseConfig ? firebaseBackend : localBackend;
```
`.env`에 Firebase 값이 있으면 클라우드, 없으면 로컬. **나머지 코드는 한 줄도 안 바뀐다.**

**`local.ts` (localStorage 구현)**
- 데이터를 `teamflow:project:{코드}` 키에 JSON으로 저장.
- **실시간 흉내**: 다른 탭 변경은 브라우저 `storage` 이벤트로, 같은 탭 변경은 in-memory `listeners`(콜백 Set)로 알린다. → 노트북 한 대에서 탭 2개로 실시간 동기화 데모 가능.
- 한 가지 함정(아래 7장 버그 참고): `subscribe()`가 **호출 도중 첫 스냅샷을 동기적으로 즉시 방출**한다.

**`firebase.ts` (Firestore 구현)**
- `projects/{코드}` 문서 + `members`/`todos`/`messages` 서브컬렉션.
- `onSnapshot`으로 실시간 구독(서버 변경이 자동으로 콜백으로 들어옴).
- 사용자별 `users/{이름}` 문서에 참여 프로젝트 배열(`arrayUnion`/`arrayRemove`)과 `pinHash` 저장.

**설명 포인트**: "인터페이스 하나에 구현 둘"이 왜 좋은가 → ① 데모는 설정 없이 즉시(local), 발표/실사용은 클라우드(firebase). ② store·컴포넌트는 저장소 교체에 영향 0. ③ 새 기능(채팅, PIN)을 **인터페이스에 메서드만 추가**하면 양쪽에 동일하게 반영.

---

### 5.3 `src/store/useStore.ts` — 두뇌 ★ (가장 중요)

Zustand 스토어 하나에 **상태 + 모든 액션**이 들어 있다. 데이터 흐름의 중심.

**(1) 상태**: `currentUser`(로그인), `homeProjects`(내 프로젝트 목록), `projectCode`, `members`, `todos`, `messages`, `darkMode`, `activeTab`, `storageMode` 등.

**(2) `persist` 미들웨어**: 단, 데이터 전체가 아니라 **로그인·현재 코드·다크모드만** localStorage에 저장(`partialize`). 실제 데이터는 항상 backend 구독으로 다시 받는다(단일 진실 공급원 유지).

**(3) 구독 → 상태 미러링** (`subscribeToProject`): 핵심 함수.
```ts
currentUnsub = backend.subscribe(code, {
  onProject: (meta) => set({ projectName, projectDeadline, loading:false }),
  onMembers: (members) => set({ members: 정렬 }),
  onTodos:   (todos)   => set({ todos: 정렬 }),
  onMessages:(msgs)    => set({ messages: 정렬 }),
});
```
backend에서 데이터가 바뀔 때마다 콜백이 불려 `set()`으로 상태를 갈아끼운다. **컴포넌트는 이 상태를 구독만** 하면 자동으로 다시 그려진다.

**(4) 액션은 "쓰기"만** 한다. 예) 할 일 완료 토글:
```ts
toggleTodo: async (id) => {
  const t = get().todos.find(x => x.id === id);
  await backend.updateTodo(code, id, { completed: !t.completed });
  // 여기서 끝. 상태는 직접 안 고침 → 구독 콜백(onTodos)이 알아서 갱신.
}
```
→ "내 변경"과 "팀원 변경"이 같은 경로(구독)로 들어와 화면이 일관되게 갱신된다.

**(5) 로그인** (`login(name, pin)`): 이름+PIN을 받아 PIN 해시를 비교. 처음 보는 이름이면 등록, 기존이면 일치해야 통과(자세히 5.5).

**설명 포인트(발표 추천)**: "왜 액션에서 상태를 직접 안 바꾸고 backend에만 쓰나?" → **단방향 데이터 흐름**. 화면은 오직 구독 결과만 신뢰. 그래서 멀티유저 실시간이 공짜로 된다.

---

### 5.4 결정적 알고리즘 ★ (AI 없이 "왜 이 결과인지" 설명 가능)

#### `src/lib/roleAssign.ts` — 역할 자동 분배
팀원 수와 역할 수(5개)가 달라도 균형 있게 배정.
- **팀원 ≥ 역할**: 섞은 뒤 `roles[i % 역할수]`로 한 명씩, 남으면 순환 중복.
- **팀원 < 역할**: 역할을 팀원에게 라운드로빈 → 일부 팀원이 2개 이상.
- `shuffle`(Fisher–Yates)로 매번 다른 배정("다시 섞기" 가능).

#### `src/lib/meetingTime.ts` — 회의시간 추천
1. 모든 팀원의 `availability`를 슬롯별로 모아 **인원 집계**(`tally`).
2. **2명 이상** 겹치는 슬롯만 남김.
3. 인원 **내림차순** 정렬, 동률이면 `slotOrder`(요일→시간 순)로 **타이브레이크** → 항상 같은 입력에 같은 결과(결정적).
4. 상위 `topN`(기본 3) 반환. `slotCounts`는 그리드 히트맵용 슬롯별 인원 수.

**설명 포인트**: "동률일 때 순서가 흔들리지 않게 보조 정렬 키를 넣었다"가 좋은 디테일. AI라면 "왜 이 시간?"을 못 밝히지만, 우리는 **집계+정렬 규칙**으로 100% 설명 가능.

---

### 5.5 인증: `src/lib/hash.ts` + store `login`

- **이름 + 4자리 PIN** 로그인(사칭 방지 경량 보호).
- PIN을 평문이 아니라 **SHA-256 해시**(이름을 salt로 섞음)로 저장 — 브라우저 기본 `crypto.subtle`, 외부 라이브러리 0.
- 흐름: 처음 보는 이름 → 입력 PIN으로 등록 / 기존 이름 → 해시 일치해야 통과 / 불일치 → 거부.
- **정직한 한계(보고서/발표에 명시)**: 보안 규칙이 열려 있으면 해시를 읽어 4자리(1만 가지)를 무차별 대입 가능 → "캐주얼 사칭 방지" 수준이지 진짜 인증은 아님. 운영 시 Firebase Auth로 대체.

---

### 5.6 보조 라이브러리

- **`dday.ts`**: dayjs로 `D-{n}`/`D-DAY`/지남 계산. `deadlineLevel`로 임박(0~3일)·지남 강조.
- **`colors.ts`**: 이름 문자열을 해시 → 고정 HSL 색. 같은 이름은 항상 같은 아바타 색(결정적).
- **`projectCode.ts`**: 헷갈리는 문자(O/0/I/1) 제외한 **6자리** 코드 생성·정규화·검증. 약 10억 조합.

---

### 5.7 화면 흐름: `src/App.tsx` (라우팅) + 컴포넌트

`App.tsx`는 상태에 따라 **3단계**로 화면을 가른다(별도 라우터 없이 조건부 렌더링):
```
로그인 안 함 → <LoginScreen/>
로그인했고 프로젝트 안 들어감 → <HomeScreen/>  (내 프로젝트 목록)
프로젝트 들어감 → <Header/> + <TabNav/> + 탭별 패널
```
- 최초 진입 시 URL `?p={코드}`가 있으면 그 프로젝트로 바로 입장(초대 링크), 없으면 홈 목록 새로고침.
- 탭: 대시보드 · 팀원 · 역할 · 회의시간 · 할 일 · 채팅 → `activeTab`으로 해당 Panel만 렌더.

**컴포넌트별 역할(요약)**
| 컴포넌트 | 하는 일 | 쓰는 store 액션 |
|---|---|---|
| `auth/LoginScreen` | 이름+PIN 입력 | `login` |
| `home/HomeScreen` | 내 프로젝트 카드(진행률/D-Day), 새 프로젝트/참여, 샘플 | `createProject` `joinProject` `openProject` `createSampleProject` `removeFromHome` |
| `layout/Header` | 프로젝트명·코드·D-Day·뒤로가기·다크모드·저장모드 | `goHome` `toggleDarkMode` |
| `layout/TabNav` | 탭 전환 | `setActiveTab` |
| `members/MemberPanel` | 팀원 추가/삭제 | `addMember` `removeMember` |
| `roles/RolePanel` | 역할 자동 배정/초기화 | `assignRolesAuto` `clearRoles` |
| `meeting/MeetingPanel` + `AvailabilityGrid` | 가능시간 드래그 입력·히트맵·추천 Top3 | `toggleSlot` `clearAvailability` |
| `todos/TodoPanel` + `TodoItem` | 할 일 추가/완료/삭제, 마감 강조 | `addTodo` `toggleTodo` `removeTodo` |
| `dashboard/Dashboard` | 진행률·요약카드·팀원별 진행률·D-Day | (상태 읽기 중심) |
| `chat/ChatPanel` | 팀 채팅(좌/우 말풍선) | `sendMessage` |

---

## 6. 구체적 데이터 흐름 예시 (발표 시연용 시나리오)

**"팀원이 할 일을 완료 체크하면 내 화면도 바뀐다"** 를 코드로 따라가기:

1. 팀원 B가 `TodoItem`의 체크박스 클릭 → `toggleTodo(id)` 호출.
2. store 액션이 `backend.updateTodo(code, id, { completed: true })` **쓰기**.
3. Firestore(또는 localStorage)의 해당 todo 문서가 바뀜.
4. 이 프로젝트를 구독 중인 **모든 클라이언트**(A의 노트북 포함)에 `onTodos` 콜백 발화.
5. 각자의 store가 `set({ todos: 새 목록 })`으로 상태 갱신.
6. `Dashboard`·`TodoPanel`이 그 상태를 구독 중이므로 **자동 재렌더** → A의 진행률 %가 즉시 올라감.

→ "한 명이 바꾸면 모두 갱신"이 **추가 코드 없이** 단방향 흐름만으로 달성됨. 이게 이 서비스의 기술적 핵심.

---

## 7. AI가 만든 코드를 우리가 검증·수정한 사례 (명세 "Effective use of AI" 15%)

발표에서 "AI 출력을 그대로 안 쓰고 검증했다"는 증거로 쓰기 좋은 사례들:

1. **동기 방출(TDZ) 버그**: 샘플 프로젝트의 멤버 ID를 모으는 임시 구독에서, 로컬 백엔드가 `subscribe()` **도중** 첫 스냅샷을 **동기적으로** 방출 → `unsub` 변수가 초기화되기 전에 호출(Temporal Dead Zone)되어 할 일이 0개 생성되는 버그를 발견·수정(`useStore.ts`의 `collectMemberIds`, `settled` 플래그 도입).
2. **샘플 데이터 비파괴 전환**: 원래 "샘플 불러오기"가 현재 프로젝트를 초기화해 작업물이 사라지던 문제 → **별도의 새 예시 프로젝트**로 생성하도록 설계 변경.
3. **저장 백엔드 추상화**: 명세의 "Firestore 전용" 가정을 그대로 따르지 않고, 초보 사용자도 설정 없이 쓰도록 인터페이스로 추상화하는 설계 판단을 직접 내림.
4. **회의시간 타이브레이크**: 인원 동률일 때 순서가 흔들리는 문제를 잡아 보조 정렬 키 추가.

(전체 목록은 `AI_USAGE.md` 참고.)

---

## 8. 발표 Q&A 대비 — 각자 답할 수 있어야 하는 질문

명세 9장(개인별 이해도 점검)은 교수가 **개별 학생**에게 묻습니다. 아래를 셀프 점검하세요.

**전원 공통**
- 이 서비스의 문제·타깃 사용자·사용 시나리오를 1분 안에 설명할 수 있는가?
- "데이터가 어떻게 흐르는가?"(2장 그림) → **쓰기 → 구독 → 상태 → UI** 를 말할 수 있는가?
- AI를 어떻게 썼고, 그 출력을 어떻게 검증했는가?(7장)

**파일/주제별 (담당자가 깊게)**
| 주제 | 예상 질문 | 핵심 답 |
|---|---|---|
| 저장 추상화 | "로컬과 Firebase를 어떻게 자동 전환?" | `index.ts`에서 `hasFirebaseConfig`로 backend를 고름. store는 인터페이스만 호출 |
| 실시간 동기화 | "한 명이 바꾸면 왜 모두 갱신되나?" | 모든 클라이언트가 같은 프로젝트를 `subscribe` → 변경 시 `onTodos` 등이 모두에게 발화 |
| 역할 분배 | "팀원이 역할보다 많으면/적으면?" | 5.4 — 순환 배정 vs 라운드로빈 |
| 회의시간 추천 | "왜 이 시간이 1등인가?" | 슬롯별 인원 집계 → 2명+ → 내림차순(동률은 요일·시간 순) |
| 로그인/PIN | "PIN은 안전한가?" | SHA-256 해시 저장. 단 규칙 개방 시 4자리는 브루트포스 가능 → 경량 보호임을 인정(한계 명시) |
| 상태관리 | "왜 액션에서 상태를 직접 안 고치나?" | 단방향 흐름 유지 → 멀티유저 일관성 |

**추천 역할 분담(예시)** — 각자 "핵심 코드 파일 1개"를 맡아 설명:
- 팀원1: `useStore.ts`(상태/데이터 흐름) — 가장 중요
- 팀원2: `lib/backend/`(저장 추상화 + 실시간)
- 팀원3: `roleAssign.ts` + `meetingTime.ts`(결정적 알고리즘)
- 팀원4: UI 컴포넌트 흐름(`App.tsx` 라우팅 + 한 패널) + 로그인/PIN

---

## 9. 로컬 실행 방법 (팀원이 코드 받은 직후)

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 → http://localhost:5173
npm run build        # 타입체크 + 프로덕션 빌드
```

- **Firebase 설정 없이도** 바로 실행됨(로컬 저장 모드). 같은 코드를 연 다른 탭끼리 실시간 동기화.
- 클라우드 실시간을 쓰려면 `.env`에 Firebase 값 6개를 넣는다(`README.md` 6장 참고). **`.env`는 절대 커밋하지 않는다**(`.gitignore`에 포함).

---

## 10. 한계와 향후 개선 (명세 "Limitations and Future Work")

- **인증**: 이름+PIN은 경량 보호일 뿐. 운영 시 Firebase Auth(구글 로그인 등) 필요.
- **보안 규칙**: 현재 테스트 모드(약 30일 후 만료). 코드 기반 접근 규칙으로 교체 권장(README 6장).
- **권한**: 코드를 아는 사람은 누구나 읽기/쓰기 가능 → 멤버십 기반 규칙으로 강화 가능.
- **확장**: 파일 첨부, 알림(푸시), 캘린더 연동, 역할별 권한 등.

---

> 이 문서는 코드를 그대로 반영합니다. 코드를 고치면 이 분석도 같이 업데이트하세요.
