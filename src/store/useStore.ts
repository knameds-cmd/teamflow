import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member, Todo, Message, Role, SlotKey } from '../types';
import { backend, storageMode } from '../lib/backend';
import { ProjectStats, Unsubscribe } from '../lib/backend/types';
import { generateCode } from '../lib/projectCode';
import { colorFromName } from '../lib/colors';
import { hashPin } from '../lib/hash';
import { assignRoles } from '../lib/roleAssign';
import {
  sampleMembers,
  SAMPLE_TODOS,
  sampleTodoTitleToDue,
  sampleDeadline,
} from '../sampleData';

// 구독 해제 함수는 직렬화 불가 → store 바깥(모듈 스코프)에 보관.
let currentUnsub: Unsubscribe | null = null;

// 사용자 식별자(=이름)를 정규화. Firestore 문서 ID로도 쓰이므로 공백만 정리.
const userKeyFromName = (name: string) => name.trim();

export interface HomeProject {
  code: string;
  stats: ProjectStats;
}

interface StoreState {
  // 사용자(간단 이름 로그인)
  currentUser: string | null; // persist 대상

  // 내 프로젝트 목록 (홈 화면)
  homeProjects: HomeProject[];
  homeLoading: boolean;

  // 공유 식별자
  projectCode: string | null; // persist 대상
  loading: boolean;

  // 프로젝트
  projectName: string;
  projectDeadline: string | null;

  members: Member[];
  todos: Todo[];
  messages: Message[];

  // UI
  darkMode: boolean; // persist 대상
  activeTab: string;
  storageMode: 'firebase' | 'local';

  // 로그인 (이름 + 4자리 PIN). created=true면 이번에 새로 등록된 사용자.
  login: (name: string, pin: string) => Promise<{ created: boolean }>;
  logout: () => void;

  // 홈(다중 프로젝트)
  refreshHomeProjects: () => Promise<void>;
  removeFromHome: (code: string) => Promise<void>;
  createSampleProject: () => Promise<string>;

  // 생명주기
  createProject: (name: string) => Promise<string>;
  joinProject: (code: string) => Promise<void>;
  openProject: (code: string) => Promise<void>;
  subscribeToProject: (code: string) => void;
  goHome: () => void;
  leaveProject: () => void;

  // 프로젝트 정보
  setProjectName: (name: string) => Promise<void>;
  setProjectDeadline: (date: string | null) => Promise<void>;

  // 팀원
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;

  // 역할
  assignRolesAuto: () => Promise<void>;
  clearRoles: () => Promise<void>;

  // 회의시간
  toggleSlot: (memberId: string, slot: SlotKey) => Promise<void>;
  clearAvailability: (memberId: string) => Promise<void>;

  // 할 일
  addTodo: (input: { title: string; assigneeId: string | null; dueDate: string | null }) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;

  // 채팅
  sendMessage: (text: string) => Promise<void>;

  // 기타
  toggleDarkMode: () => void;
  setActiveTab: (tab: string) => void;
  resetAll: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      homeProjects: [],
      homeLoading: false,

      projectCode: null,
      loading: false,
      projectName: '',
      projectDeadline: null,
      members: [],
      todos: [],
      messages: [],
      darkMode: false,
      activeTab: 'dashboard',
      storageMode,

      login: async (name, pin) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error('이름을 입력하세요');
        if (!/^\d{4}$/.test(pin)) throw new Error('PIN은 숫자 4자리예요');

        const key = userKeyFromName(trimmed);
        const inputHash = await hashPin(key, pin);
        const storedHash = await backend.getUserPinHash(key);

        let created = false;
        if (storedHash === null) {
          // 처음 보는 이름 → 입력한 PIN으로 새로 등록
          await backend.setUserPinHash(key, inputHash);
          created = true;
        } else if (storedHash !== inputHash) {
          throw new Error('PIN이 일치하지 않습니다');
        }

        set({ currentUser: trimmed });
        await get().refreshHomeProjects();
        return { created };
      },

      logout: () => {
        currentUnsub?.();
        currentUnsub = null;
        set({
          currentUser: null,
          projectCode: null,
          projectName: '',
          projectDeadline: null,
          members: [],
          todos: [],
          messages: [],
          homeProjects: [],
          activeTab: 'dashboard',
        });
      },

      refreshHomeProjects: async () => {
        const user = get().currentUser;
        if (!user) return;
        set({ homeLoading: true });
        const codes = await backend.getUserProjects(userKeyFromName(user));
        const stats = await Promise.all(codes.map((c) => backend.getProjectStats(c)));
        const homeProjects: HomeProject[] = [];
        codes.forEach((code, i) => {
          const s = stats[i];
          if (s) homeProjects.push({ code, stats: s });
        });
        // 최근 만든 순으로 정렬
        homeProjects.sort((a, b) => b.stats.meta.createdAt - a.stats.meta.createdAt);
        set({ homeProjects, homeLoading: false });
      },

      removeFromHome: async (code) => {
        const user = get().currentUser;
        if (!user) return;
        await backend.removeUserProject(userKeyFromName(user), code);
        await get().refreshHomeProjects();
      },

      createProject: async (name) => {
        const code = generateCode();
        await backend.createProject(code, name.trim() || '우리 팀 프로젝트');
        const user = get().currentUser;
        if (user) await backend.addUserProject(userKeyFromName(user), code);
        get().subscribeToProject(code);
        return code;
      },

      createSampleProject: async () => {
        const code = generateCode();
        await backend.createProject(code, '샘플 프로젝트 (예시)');
        const user = get().currentUser;
        if (user) await backend.addUserProject(userKeyFromName(user), code);
        await backend.setProjectMeta(code, { projectDeadline: sampleDeadline() });
        await backend.bulkSetMembers(code, sampleMembers());

        // 할 일의 담당자를 매핑하려면 방금 만든 멤버들의 ID가 필요하다.
        // (firebase는 쓰기→스냅샷 왕복이 있으므로) 임시 구독으로 이름→ID 맵을 수집.
        const nameToId = await collectMemberIds(code);
        await backend.bulkSetTodos(
          code,
          SAMPLE_TODOS.map((seed) => ({
            title: seed.title,
            assigneeId: seed.assigneeName ? (nameToId.get(seed.assigneeName) ?? null) : null,
            dueDate: sampleTodoTitleToDue(seed),
            completed: seed.completed,
          })),
        );
        get().subscribeToProject(code); // 만든 즉시 그 프로젝트로 진입
        return code;
      },

      joinProject: async (code) => {
        const exists = await backend.projectExists(code);
        if (!exists) throw new Error('존재하지 않는 코드입니다');
        const user = get().currentUser;
        if (user) await backend.addUserProject(userKeyFromName(user), code);
        get().subscribeToProject(code);
      },

      openProject: async (code) => {
        const user = get().currentUser;
        if (user) await backend.addUserProject(userKeyFromName(user), code);
        get().subscribeToProject(code);
      },

      subscribeToProject: (code) => {
        currentUnsub?.();
        set({
          projectCode: code,
          loading: true,
          activeTab: 'dashboard',
          members: [],
          todos: [],
          messages: [],
        });
        currentUnsub = backend.subscribe(code, {
          onProject: (meta) =>
            set({
              projectName: meta?.projectName ?? '',
              projectDeadline: meta?.projectDeadline ?? null,
              loading: false,
            }),
          onMembers: (members) =>
            set({ members: [...members].sort((a, b) => a.createdAt - b.createdAt) }),
          onTodos: (todos) =>
            set({ todos: [...todos].sort((a, b) => a.createdAt - b.createdAt) }),
          onMessages: (messages) =>
            set({ messages: [...messages].sort((a, b) => a.createdAt - b.createdAt) }),
        });
      },

      // 프로젝트에서 나와 홈(내 프로젝트 목록)으로. 로그인 상태는 유지.
      goHome: () => {
        currentUnsub?.();
        currentUnsub = null;
        set({
          projectCode: null,
          projectName: '',
          projectDeadline: null,
          members: [],
          todos: [],
          messages: [],
          loading: false,
          activeTab: 'dashboard',
        });
        get().refreshHomeProjects();
      },

      // 하위 호환: 완전히 나가기(로그아웃과 동일하게 동작)
      leaveProject: () => get().goHome(),

      setProjectName: async (name) => {
        const code = get().projectCode;
        if (code) await backend.setProjectMeta(code, { projectName: name });
      },

      setProjectDeadline: async (date) => {
        const code = get().projectCode;
        if (code) await backend.setProjectMeta(code, { projectDeadline: date });
      },

      addMember: async (name) => {
        const code = get().projectCode;
        if (!code) return;
        const trimmed = name.trim();
        if (!trimmed) throw new Error('이름을 입력하세요');
        if (get().members.some((m) => m.name === trimmed)) {
          throw new Error('이미 있는 팀원입니다');
        }
        await backend.addMember(code, {
          name: trimmed,
          color: colorFromName(trimmed),
          roles: [],
          availability: [],
        });
      },

      removeMember: async (id) => {
        const code = get().projectCode;
        if (!code) return;
        await backend.deleteMember(code, id);
        // 담당이던 할 일은 삭제하지 않고 미배정 처리
        await Promise.all(
          get()
            .todos.filter((t) => t.assigneeId === id)
            .map((t) => backend.updateTodo(code, t.id, { assigneeId: null })),
        );
      },

      assignRolesAuto: async () => {
        const code = get().projectCode;
        if (!code) return;
        const result = assignRoles(get().members);
        await Promise.all(
          Object.entries(result).map(([mid, roles]) => backend.updateMember(code, mid, { roles })),
        );
      },

      clearRoles: async () => {
        const code = get().projectCode;
        if (!code) return;
        await Promise.all(
          get().members.map((m) => backend.updateMember(code, m.id, { roles: [] as Role[] })),
        );
      },

      toggleSlot: async (memberId, slot) => {
        const code = get().projectCode;
        if (!code) return;
        const m = get().members.find((x) => x.id === memberId);
        if (!m) return;
        const next = m.availability.includes(slot)
          ? m.availability.filter((s) => s !== slot)
          : [...m.availability, slot];
        await backend.updateMember(code, memberId, { availability: next });
      },

      clearAvailability: async (memberId) => {
        const code = get().projectCode;
        if (!code) return;
        await backend.updateMember(code, memberId, { availability: [] });
      },

      addTodo: async ({ title, assigneeId, dueDate }) => {
        const code = get().projectCode;
        if (!code) return;
        const trimmed = title.trim();
        if (!trimmed) throw new Error('할 일 제목을 입력하세요');
        await backend.addTodo(code, {
          title: trimmed,
          assigneeId,
          dueDate,
          completed: false,
        });
      },

      toggleTodo: async (id) => {
        const code = get().projectCode;
        if (!code) return;
        const t = get().todos.find((x) => x.id === id);
        if (!t) return;
        await backend.updateTodo(code, id, { completed: !t.completed });
      },

      removeTodo: async (id) => {
        const code = get().projectCode;
        if (code) await backend.deleteTodo(code, id);
      },

      sendMessage: async (text) => {
        const code = get().projectCode;
        const user = get().currentUser;
        if (!code || !user) return;
        const trimmed = text.trim();
        if (!trimmed) return;
        await backend.addMessage(code, { author: user, text: trimmed });
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setActiveTab: (tab) => set({ activeTab: tab }),

      resetAll: async () => {
        const code = get().projectCode;
        if (code) await backend.clearAll(code);
      },
    }),
    {
      name: 'teamflow-ui',
      // 데이터가 아니라 "로그인 사용자 + 현재 프로젝트 코드 + 다크모드"만 저장
      partialize: (s) => ({
        currentUser: s.currentUser,
        projectCode: s.projectCode,
        darkMode: s.darkMode,
      }),
    },
  ),
);

// 샘플 프로젝트의 멤버 이름→ID 맵을 임시 구독으로 1회 수집한다.
// (store 상태를 더럽히지 않도록 별도 구독을 잠깐 열었다 닫는다.)
//
// 주의: 로컬 백엔드는 subscribe() 호출 도중 동기적으로 첫 스냅샷을 방출한다.
// 그래서 onMembers가 subscribe()가 반환되기 "전에" 불릴 수 있고, 그 시점엔
// unsub 변수가 아직 할당되지 않았다. settled 플래그로 이 경우를 안전하게 처리한다.
function collectMemberIds(code: string): Promise<Map<string, string>> {
  return new Promise((resolve) => {
    const map = new Map<string, string>();
    let settled = false;
    let unsub: () => void = () => {};

    const finish = () => {
      if (settled) return;
      settled = true;
      unsub();
      resolve(map);
    };

    unsub = backend.subscribe(code, {
      onProject: () => {},
      onMembers: (members) => {
        members.forEach((m) => map.set(m.name, m.id));
        if (members.length > 0) finish();
      },
      onTodos: () => {},
      onMessages: () => {},
    });

    if (settled) {
      // 동기 방출로 이미 끝난 경우: 위 finish()의 unsub()은 빈 함수였으니 여기서 진짜로 해제.
      unsub();
    } else {
      // 안전장치: 2초 후엔 그때까지 모은 것으로 종료 (firebase 지연 대비)
      setTimeout(finish, 2000);
    }
  });
}
