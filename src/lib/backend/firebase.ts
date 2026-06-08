import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getDb } from '../firebase';
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

// 명세서 10장의 Firestore 데이터 흐름 구현.
// projects/{code} 문서 + members/todos/messages 서브컬렉션. onSnapshot으로 실시간 구독.
function projectRef(code: string) {
  return doc(getDb(), 'projects', code);
}
function membersRef(code: string) {
  return collection(getDb(), 'projects', code, 'members');
}
function todosRef(code: string) {
  return collection(getDb(), 'projects', code, 'todos');
}
function messagesRef(code: string) {
  return collection(getDb(), 'projects', code, 'messages');
}
function userRef(userKey: string) {
  return doc(getDb(), 'users', userKey);
}

export const firebaseBackend: ProjectBackend = {
  mode: 'firebase',

  async createProject(code, name) {
    await setDoc(projectRef(code), {
      projectName: name,
      projectDeadline: null,
      createdAt: Date.now(),
    } satisfies ProjectMeta);
  },

  async projectExists(code) {
    const snap = await getDoc(projectRef(code));
    return snap.exists();
  },

  subscribe(code, handlers: SubscribeHandlers): Unsubscribe {
    const unsubs = [
      onSnapshot(projectRef(code), (s) => {
        handlers.onProject(s.exists() ? (s.data() as ProjectMeta) : null);
      }),
      onSnapshot(membersRef(code), (s) => {
        handlers.onMembers(s.docs.map((d) => ({ id: d.id, ...d.data() })) as Member[]);
      }),
      onSnapshot(todosRef(code), (s) => {
        handlers.onTodos(s.docs.map((d) => ({ id: d.id, ...d.data() })) as Todo[]);
      }),
      onSnapshot(query(messagesRef(code), orderBy('createdAt')), (s) => {
        handlers.onMessages(s.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  },

  async setProjectMeta(code, patch) {
    await updateDoc(projectRef(code), patch);
  },

  async addMember(code, member: NewMember) {
    await addDoc(membersRef(code), { ...member, createdAt: Date.now() });
  },

  async updateMember(code, id, patch) {
    await updateDoc(doc(getDb(), 'projects', code, 'members', id), patch);
  },

  async deleteMember(code, id) {
    await deleteDoc(doc(getDb(), 'projects', code, 'members', id));
  },

  async addTodo(code, todo: NewTodo) {
    await addDoc(todosRef(code), { ...todo, createdAt: Date.now() });
  },

  async updateTodo(code, id, patch) {
    await updateDoc(doc(getDb(), 'projects', code, 'todos', id), patch);
  },

  async deleteTodo(code, id) {
    await deleteDoc(doc(getDb(), 'projects', code, 'todos', id));
  },

  async addMessage(code, message: NewMessage) {
    await addDoc(messagesRef(code), { ...message, createdAt: Date.now() });
  },

  async bulkSetMembers(code, members) {
    let t = Date.now();
    await Promise.all(members.map((m) => addDoc(membersRef(code), { ...m, createdAt: t++ })));
  },

  async bulkSetTodos(code, todos) {
    let t = Date.now();
    await Promise.all(todos.map((todo) => addDoc(todosRef(code), { ...todo, createdAt: t++ })));
  },

  async clearAll(code) {
    const [ms, ts] = await Promise.all([getDocs(membersRef(code)), getDocs(todosRef(code))]);
    await Promise.all([
      ...ms.docs.map((d) => deleteDoc(d.ref)),
      ...ts.docs.map((d) => deleteDoc(d.ref)),
    ]);
  },

  // ---- 사용자별 프로젝트 목록: users/{userKey} 문서의 projects 배열 ----
  async addUserProject(userKey, code) {
    await setDoc(userRef(userKey), { projects: arrayUnion(code) }, { merge: true });
  },

  async removeUserProject(userKey, code) {
    await setDoc(userRef(userKey), { projects: arrayRemove(code) }, { merge: true });
  },

  async getUserProjects(userKey) {
    const snap = await getDoc(userRef(userKey));
    const arr = snap.exists() ? (snap.data().projects as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]) : [];
  },

  // ---- 간단 PIN 인증: users/{userKey} 문서의 pinHash 필드 ----
  async getUserPinHash(userKey) {
    const snap = await getDoc(userRef(userKey));
    if (!snap.exists()) return null;
    const hash = snap.data().pinHash as unknown;
    return typeof hash === 'string' ? hash : null;
  },

  async setUserPinHash(userKey, pinHash) {
    await setDoc(userRef(userKey), { pinHash }, { merge: true });
  },

  async getProjectStats(code): Promise<ProjectStats | null> {
    const [metaSnap, todoSnap, memberSnap] = await Promise.all([
      getDoc(projectRef(code)),
      getDocs(todosRef(code)),
      getDocs(membersRef(code)),
    ]);
    if (!metaSnap.exists()) return null;
    const todos = todoSnap.docs.map((d) => d.data() as Todo);
    return {
      meta: metaSnap.data() as ProjectMeta,
      memberCount: memberSnap.size,
      totalTodos: todos.length,
      doneTodos: todos.filter((t) => t.completed).length,
    };
  },
};
