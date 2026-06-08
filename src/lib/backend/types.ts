import { Member, Todo, Message, ProjectMeta } from '../../types';

export interface SubscribeHandlers {
  onProject: (meta: ProjectMeta | null) => void;
  onMembers: (members: Member[]) => void;
  onTodos: (todos: Todo[]) => void;
  onMessages: (messages: Message[]) => void;
}

export type Unsubscribe = () => void;

// 신규 문서 입력 (id/createdAt은 백엔드가 부여)
export type NewMember = Omit<Member, 'id' | 'createdAt'>;
export type NewTodo = Omit<Todo, 'id' | 'createdAt'>;
export type NewMessage = Omit<Message, 'id' | 'createdAt'>;

// 홈 화면(내 프로젝트 목록) 카드에 쓰는 1회성 요약 통계
export interface ProjectStats {
  meta: ProjectMeta;
  memberCount: number;
  totalTodos: number;
  doneTodos: number;
}

// store와 컴포넌트가 의존하는 유일한 저장 인터페이스.
// 구현체는 Firestore(클라우드) 또는 localStorage(로컬) 중 하나.
export interface ProjectBackend {
  readonly mode: 'firebase' | 'local';

  createProject(code: string, name: string): Promise<void>;
  projectExists(code: string): Promise<boolean>;
  subscribe(code: string, handlers: SubscribeHandlers): Unsubscribe;

  setProjectMeta(code: string, patch: Partial<Pick<ProjectMeta, 'projectName' | 'projectDeadline'>>): Promise<void>;

  addMember(code: string, member: NewMember): Promise<void>;
  updateMember(code: string, id: string, patch: Partial<Member>): Promise<void>;
  deleteMember(code: string, id: string): Promise<void>;

  addTodo(code: string, todo: NewTodo): Promise<void>;
  updateTodo(code: string, id: string, patch: Partial<Todo>): Promise<void>;
  deleteTodo(code: string, id: string): Promise<void>;

  // 팀 채팅
  addMessage(code: string, message: NewMessage): Promise<void>;

  // 샘플 데이터 일괄 생성 / 전체 초기화
  bulkSetMembers(code: string, members: NewMember[]): Promise<void>;
  bulkSetTodos(code: string, todos: NewTodo[]): Promise<void>;
  clearAll(code: string): Promise<void>;

  // 사용자별 프로젝트 목록 (개인 북마크). userKey = 정규화된 이름.
  // 여러 과제를 한 사람이 오갈 수 있도록 "내가 들어가 본 프로젝트"를 기억한다.
  addUserProject(userKey: string, code: string): Promise<void>;
  removeUserProject(userKey: string, code: string): Promise<void>;
  getUserProjects(userKey: string): Promise<string[]>;

  // 간단 PIN 인증 (이름 사칭 방지용 경량 보호).
  // getUserPinHash: 저장된 해시. null이면 아직 PIN 미설정 = "처음 보는 사용자".
  getUserPinHash(userKey: string): Promise<string | null>;
  setUserPinHash(userKey: string, pinHash: string): Promise<void>;

  // 홈 카드용 진행률 요약 (구독이 아니라 1회 읽기)
  getProjectStats(code: string): Promise<ProjectStats | null>;
}
