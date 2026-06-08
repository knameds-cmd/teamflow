export const ROLES = ['발표', 'PPT 제작', '자료조사', '보고서 작성', '일정 관리'] as const;
export type Role = (typeof ROLES)[number];

export const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
export type Day = (typeof DAYS)[number];

// 회의시간 그리드: 09:00 ~ 22:00 (1시간 단위)
export const TIMES = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
] as const;
export type Time = (typeof TIMES)[number];

// 슬롯 키 포맷: `${day}-${time}` 예) "월-18:00"
export type SlotKey = `${Day}-${Time}`;

export interface Member {
  id: string; // 문서 ID
  name: string;
  color: string; // 이름 기반 자동 생성 hex/hsl
  roles: Role[]; // 배정된 역할 (한 명이 여러 개 가능)
  availability: SlotKey[]; // 회의 가능 시간 슬롯
  createdAt: number;
}

export interface Todo {
  id: string; // 문서 ID
  title: string;
  assigneeId: string | null; // Member.id
  dueDate: string | null; // "YYYY-MM-DD"
  completed: boolean;
  createdAt: number;
}

export interface ProjectMeta {
  projectName: string;
  projectDeadline: string | null; // "YYYY-MM-DD"
  createdAt: number;
}

// 팀 채팅 메시지
export interface Message {
  id: string; // 문서 ID
  author: string; // 보낸 사람 이름 (로그인한 사용자)
  text: string;
  createdAt: number;
}
