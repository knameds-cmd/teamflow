import { Member, Todo, Message, ProjectMeta } from '../../types';
import {
  NewMember,
  NewMessage,
  NewTodo,
  ProjectBackend,
  ProjectStats,
  SubscribeHandlers,
  Unsubscribe,
} from './types';

// Firebase 미설정 시 사용하는 localStorage 백엔드.
// 데이터는 브라우저에 JSON(수십 KB)으로 저장되고, 같은 코드로 연 다른 탭과는
// `storage` 이벤트로, 같은 탭 안에서는 in-memory emitter로 실시간 동기화된다.

interface ProjectData {
  meta: ProjectMeta;
  members: Member[];
  todos: Todo[];
  messages: Message[];
}

const keyOf = (code: string) => `teamflow:project:${code}`;
const userKeyOf = (userKey: string) => `teamflow:user:${userKey}`;

function read(code: string): ProjectData | null {
  const raw = localStorage.getItem(keyOf(code));
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ProjectData;
    // 구버전 데이터 호환: messages 누락 시 빈 배열
    if (!Array.isArray(data.messages)) data.messages = [];
    return data;
  } catch {
    return null;
  }
}

// 같은 탭 내 구독자 (storage 이벤트는 다른 탭에서만 발생하므로 별도 emitter 필요)
const listeners = new Map<string, Set<() => void>>();

function notifyLocal(code: string) {
  listeners.get(code)?.forEach((fn) => fn());
}

function write(code: string, data: ProjectData) {
  localStorage.setItem(keyOf(code), JSON.stringify(data));
  notifyLocal(code); // 같은 탭 즉시 갱신 (storage 이벤트가 안 오므로)
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 항상 비동기처럼 동작하도록 Promise로 감싼다(인터페이스 일관성).
const ok = () => Promise.resolve();

export const localBackend: ProjectBackend = {
  mode: 'local',

  createProject(code, name) {
    write(code, {
      meta: { projectName: name, projectDeadline: null, createdAt: Date.now() },
      members: [],
      todos: [],
      messages: [],
    });
    return ok();
  },

  projectExists(code) {
    return Promise.resolve(read(code) !== null);
  },

  subscribe(code, handlers: SubscribeHandlers): Unsubscribe {
    const emit = () => {
      const data = read(code);
      handlers.onProject(data?.meta ?? null);
      handlers.onMembers(data?.members ?? []);
      handlers.onTodos(data?.todos ?? []);
      handlers.onMessages(data?.messages ?? []);
    };

    if (!listeners.has(code)) listeners.set(code, new Set());
    listeners.get(code)!.add(emit);

    const onStorage = (e: StorageEvent) => {
      if (e.key === keyOf(code)) emit();
    };
    window.addEventListener('storage', onStorage);

    emit(); // 최초 1회 즉시 방출

    return () => {
      listeners.get(code)?.delete(emit);
      window.removeEventListener('storage', onStorage);
    };
  },

  setProjectMeta(code, patch) {
    const data = read(code);
    if (data) write(code, { ...data, meta: { ...data.meta, ...patch } });
    return ok();
  },

  addMember(code, member: NewMember) {
    const data = read(code);
    if (data) {
      const full: Member = { ...member, id: genId(), createdAt: Date.now() };
      write(code, { ...data, members: [...data.members, full] });
    }
    return ok();
  },

  updateMember(code, id, patch) {
    const data = read(code);
    if (data) {
      write(code, {
        ...data,
        members: data.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      });
    }
    return ok();
  },

  deleteMember(code, id) {
    const data = read(code);
    if (data) write(code, { ...data, members: data.members.filter((m) => m.id !== id) });
    return ok();
  },

  addTodo(code, todo: NewTodo) {
    const data = read(code);
    if (data) {
      const full: Todo = { ...todo, id: genId(), createdAt: Date.now() };
      write(code, { ...data, todos: [...data.todos, full] });
    }
    return ok();
  },

  updateTodo(code, id, patch) {
    const data = read(code);
    if (data) {
      write(code, { ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
    }
    return ok();
  },

  deleteTodo(code, id) {
    const data = read(code);
    if (data) write(code, { ...data, todos: data.todos.filter((t) => t.id !== id) });
    return ok();
  },

  addMessage(code, message: NewMessage) {
    const data = read(code);
    if (data) {
      const full: Message = { ...message, id: genId(), createdAt: Date.now() };
      write(code, { ...data, messages: [...data.messages, full] });
    }
    return ok();
  },

  bulkSetMembers(code, members) {
    const data = read(code);
    if (data) {
      let t = Date.now();
      const full = members.map<Member>((m) => ({ ...m, id: genId(), createdAt: t++ }));
      write(code, { ...data, members: [...data.members, ...full] });
    }
    return ok();
  },

  bulkSetTodos(code, todos) {
    const data = read(code);
    if (data) {
      let t = Date.now();
      const full = todos.map<Todo>((todo) => ({ ...todo, id: genId(), createdAt: t++ }));
      write(code, { ...data, todos: [...data.todos, ...full] });
    }
    return ok();
  },

  clearAll(code) {
    const data = read(code);
    if (data) write(code, { ...data, members: [], todos: [] });
    return ok();
  },

  // ---- 사용자별 레코드 (localStorage 키 teamflow:user:{key}) ----
  addUserProject(userKey, code) {
    const rec = readUserRecord(userKey);
    if (!rec.projects.includes(code)) {
      writeUserRecord(userKey, { ...rec, projects: [...rec.projects, code] });
    }
    return ok();
  },

  removeUserProject(userKey, code) {
    const rec = readUserRecord(userKey);
    writeUserRecord(userKey, { ...rec, projects: rec.projects.filter((c) => c !== code) });
    return ok();
  },

  getUserProjects(userKey) {
    return Promise.resolve(readUserRecord(userKey).projects);
  },

  getUserPinHash(userKey) {
    return Promise.resolve(readUserRecord(userKey).pinHash);
  },

  setUserPinHash(userKey, pinHash) {
    const rec = readUserRecord(userKey);
    writeUserRecord(userKey, { ...rec, pinHash });
    return ok();
  },

  getProjectStats(code) {
    const data = read(code);
    if (!data) return Promise.resolve(null);
    const stats: ProjectStats = {
      meta: data.meta,
      memberCount: data.members.length,
      totalTodos: data.todos.length,
      doneTodos: data.todos.filter((t) => t.completed).length,
    };
    return Promise.resolve(stats);
  },
};

// 사용자 레코드: 참여 프로젝트 목록 + PIN 해시.
interface UserRecord {
  projects: string[];
  pinHash: string | null;
}

function readUserRecord(userKey: string): UserRecord {
  const raw = localStorage.getItem(userKeyOf(userKey));
  if (!raw) return { projects: [], pinHash: null };
  try {
    const parsed = JSON.parse(raw);
    // 구버전 호환: 예전엔 프로젝트 코드 배열만 저장했다.
    if (Array.isArray(parsed)) return { projects: parsed as string[], pinHash: null };
    return {
      projects: Array.isArray(parsed.projects) ? (parsed.projects as string[]) : [],
      pinHash: typeof parsed.pinHash === 'string' ? parsed.pinHash : null,
    };
  } catch {
    return { projects: [], pinHash: null };
  }
}

function writeUserRecord(userKey: string, rec: UserRecord) {
  localStorage.setItem(userKeyOf(userKey), JSON.stringify(rec));
}
