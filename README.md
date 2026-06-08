# TeamFlow — 대학생 팀플 관리 서비스

> 팀원 · 역할 · 회의시간 · 할 일 · 진행률 · 마감일(D-Day) · 팀 채팅을 **한 화면에서** 관리하는 경량 웹 서비스.
> 이름으로 로그인해 **여러 과제를 한눈에** 보고, 초대 코드로 팀원과 **실시간으로 함께** 봅니다.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white">
</p>

---

## 1. 문제 정의 & 타깃 사용자

학기 중 팀 프로젝트를 진행하는 대학생은 역할 분담은 카톡으로 대충, 일정은 따로, 할 일은 머릿속에 둡니다. 그 결과 **누가 · 무엇을 · 언제까지** 하는지 불투명하고 마감 직전에 일이 몰립니다. TeamFlow는 이 흩어진 정보를 한 화면에 모아 팀의 진행 상황을 항상 가시화합니다.

## 2. 핵심 기능

| 기능 | 설명 |
|---|---|
| **이름 + PIN 로그인** | 이름과 4자리 PIN으로 입장. 처음 보는 이름은 입력한 PIN으로 등록, 이후 같은 PIN을 맞춰야 입장(사칭 방지 경량 보호). PIN은 SHA-256 해시로 저장 |
| **내 프로젝트 홈** | 여러 과제(프로젝트)의 진행률·D-Day·팀원 수를 카드로 모아 보고 선택해서 진입 |
| **팀원 관리** | 이름만으로 즉시 추가, 이름 기반 자동 아바타 색상 |
| **역할 자동 분배** | 발표 / PPT / 자료조사 / 보고서 / 일정관리를 팀원 수에 맞춰 균형 배정 (다시 섞기 가능) |
| **회의 시간 조율** | When2meet 스타일 주간 그리드에 가능 시간을 칠하면, 가장 많이 겹치는 시간 Top 3 추천 |
| **할 일 관리** | 담당자 · 마감일 지정, 마감 임박(D-3 이내)·지남 강조, 완료 체크 |
| **진행률 대시보드** | 전체/팀원별 진행률, 요약 카드, 프로젝트 D-Day |
| **팀 채팅** | 프로젝트별 실시간 채팅으로 팀원과 바로 소통 |
| **실시간 공유** | 초대 코드/링크로 합류, 한 명이 바꾸면 모두의 화면이 즉시 갱신 |
| **샘플 프로젝트** | "샘플 둘러보기"는 기존 작업을 건드리지 않고 **별도의 예시 프로젝트**를 새로 생성 |

> **AI/LLM API를 사용하지 않습니다.** 역할 분배·회의시간 추천 등 모든 로직은 클라이언트에서 **결정적(deterministic) 알고리즘**으로 처리합니다(운영 비용 0원, 출력이 항상 설명 가능).

## 3. 기술 스택

React 18 · TypeScript · Vite · Tailwind CSS · Zustand(상태관리) · Firebase Firestore(선택) · dayjs · lucide-react · react-hot-toast

## 4. 로컬 실행 방법

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 실행
npm run dev
# → http://localhost:5173

# 3) 프로덕션 빌드
npm run build && npm run preview
```

> **Firebase 설정 없이도 바로 실행됩니다.** 이 경우 데이터는 브라우저(localStorage)에 저장되는 **로컬 저장 모드**로 동작하며, 같은 초대 코드를 연 다른 탭끼리는 실시간으로 동기화됩니다. 여러 기기/사람 간 실시간 공유가 필요하면 아래 Firebase 설정을 진행하세요.

## 5. 저장 모드 (2가지)

앱은 `.env`의 Firebase 값 유무에 따라 자동으로 모드를 선택합니다.

| 모드 | 조건 | 데이터 위치 | 공유 범위 |
|---|---|---|---|
| **로컬 저장** (기본) | `.env` 비어 있음 | 브라우저 localStorage (수십 KB) | 같은 브라우저의 탭끼리 |
| **클라우드 실시간** | `.env`에 Firebase 값 채움 | Firebase Firestore | 모든 기기·네트워크의 팀원 |

이 추상화는 `src/lib/backend/`에 구현되어 있습니다 (`index.ts`가 환경변수로 백엔드를 선택).

## 6. Firebase 설정 (실시간 클라우드 공유를 원할 때만)

1. [console.firebase.google.com](https://console.firebase.google.com) 접속 → **프로젝트 추가** (무료 Spark 플랜).
2. 좌측 **빌드 → Firestore Database → 데이터베이스 만들기** → 위치 `asia-northeast3`(서울) → **테스트 모드로 시작**.
3. **프로젝트 설정(⚙️) → 앱 추가 → 웹(</>)** → 앱 등록 후 나오는 `firebaseConfig` 값 복사.
4. 프로젝트 루트에 `.env` 파일을 만들고 (`cp .env.example .env`) 복사한 값을 채웁니다:

   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. 개발 서버를 재시작하면 자동으로 클라우드 실시간 모드로 전환됩니다.

**Firestore 보안 규칙(수업용)** — 코드를 아는 사람만 해당 프로젝트에 접근, 목록 나열은 차단:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{code} {
      allow get, write: if true;
      allow list: if false;
      // members / todos / messages(팀 채팅) 서브컬렉션
      match /{sub=**} { allow read, write: if true; }
    }
    // 사용자별 "내 프로젝트 목록" (이름 → 참여 프로젝트 코드 배열)
    match /users/{userKey} {
      allow read, write: if true;
    }
  }
}
```

> 인증이 없으므로 **코드를 아는 사람은 누구나 읽고 쓸 수 있습니다.** 6자리 코드(약 10억 조합)라 추측은 비현실적이지만, 운영 서비스라면 Firebase Auth + 멤버십 규칙으로 강화해야 합니다. 수업 범위에서는 위 규칙으로 충분합니다.
> **이름 + PIN 로그인의 한계**: PIN은 평문이 아니라 SHA-256(이름 salt) 해시로 `users/{이름}` 문서에 저장합니다. 다만 규칙이 열려 있으면 그 해시를 읽어 4자리 PIN(1만 가지)을 무차별 대입할 수 있으므로, "이름만 치면 사칭"을 막는 **경량 보호**일 뿐 진짜 인증이 아닙니다. 운영 시 Firebase Auth로 대체해야 합니다(보고서 한계점으로 명시).
> Firebase 웹 `apiKey`는 비밀 키가 아니라 프로젝트 식별자이며, 실제 보안은 위 규칙으로 통제됩니다. 다만 `.env`로 분리해 관리합니다.

## 7. 배포 (Vercel)

```bash
npm i -g vercel
vercel
```

빌드 명령 `npm run build`, 출력 디렉터리 `dist`. 클라우드 모드를 쓰려면 Vercel 프로젝트 **Environment Variables**에 `VITE_FIREBASE_*` 6개를 등록하세요.

## 8. 폴더 구조 (핵심)

```
src/
├── types.ts                  # 데이터 모델 (Member, Todo, Message, ROLES, TIMES …)
├── store/useStore.ts         # Zustand store: 로그인·내 프로젝트·구독 미러링·채팅 등 모든 액션
├── lib/
│   ├── backend/              # 저장 백엔드 추상화 (로컬 ↔ Firebase 자동 전환)
│   │   ├── types.ts          #   공통 인터페이스 ProjectBackend
│   │   ├── local.ts          #   localStorage 구현 (+ storage 이벤트 실시간 동기화)
│   │   ├── firebase.ts       #   Firestore 구현 (onSnapshot 실시간 구독, users·messages 포함)
│   │   └── index.ts          #   환경변수로 백엔드 선택
│   ├── roleAssign.ts         # 역할 자동 분배 알고리즘
│   ├── meetingTime.ts        # 회의시간 추천 집계 알고리즘
│   ├── dday.ts               # D-Day / 마감 임박 계산
│   ├── colors.ts             # 이름 → 아바타 색상
│   └── projectCode.ts        # 6자리 공유 코드
├── components/               # auth(로그인) / home(내 프로젝트) / layout / members / roles / meeting / todos / dashboard / chat / common
├── sampleData.ts             # 발표 데모용 샘플 (별도 예시 프로젝트로 생성)
└── App.tsx                   # 3단계 라우팅(로그인 → 내 프로젝트 → 프로젝트) + 레이아웃
```

## 9. 데이터 흐름

```
사용자 동작 → store 액션 → backend 쓰기(local 또는 Firestore)
                                   ↓
                        구독(subscribe) 스냅샷
                                   ↓
                     store 상태 미러링 → 모든 화면(나 + 팀원) 자동 갱신
```

저장소가 **단일 진실 공급원(single source of truth)**이고, 화면은 구독으로 받아 그립니다.

## 10. 라이선스 / 크레딧

수업 과제용 프로젝트입니다. 사용한 오픈소스: React, Vite, Tailwind CSS, Zustand, Firebase, dayjs, lucide-react, react-hot-toast, [Pretendard](https://github.com/orioncactus/pretendard) 폰트.
