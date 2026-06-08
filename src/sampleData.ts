import dayjs from 'dayjs';
import { Role, SlotKey } from './types';
import { colorFromName } from './lib/colors';
import { NewMember } from './lib/backend/types';

// 발표 데모용 샘플. assigneeName은 store에서 생성된 멤버 id로 변환된다.
interface SampleMemberSeed {
  name: string;
  roles: Role[];
  availability: SlotKey[];
}

const MEMBER_SEEDS: SampleMemberSeed[] = [
  { name: '김민준', roles: ['발표'], availability: ['월-18:00', '월-19:00', '수-18:00', '목-20:00'] },
  { name: '이서연', roles: ['PPT 제작'], availability: ['월-18:00', '수-18:00', '수-19:00', '금-14:00'] },
  { name: '박지후', roles: ['자료조사'], availability: ['월-18:00', '화-20:00', '수-18:00', '목-20:00'] },
  { name: '최예은', roles: ['보고서 작성'], availability: ['수-18:00', '목-20:00', '금-14:00'] },
  { name: '정도윤', roles: ['일정 관리'], availability: ['월-19:00', '수-18:00', '목-20:00'] },
];

export interface SampleTodoSeed {
  title: string;
  assigneeName: string | null;
  dueInDays: number | null; // 오늘 기준 며칠 뒤 마감
  completed: boolean;
}

export const SAMPLE_TODOS: SampleTodoSeed[] = [
  { title: '주제 선정 및 범위 확정', assigneeName: '정도윤', dueInDays: -2, completed: true },
  { title: '관련 논문·자료 5건 수집', assigneeName: '박지후', dueInDays: 1, completed: false },
  { title: '발표 슬라이드 초안 작성', assigneeName: '이서연', dueInDays: 3, completed: false },
  { title: '발표 스크립트 작성 및 연습', assigneeName: '김민준', dueInDays: 5, completed: false },
  { title: '최종 보고서 작성', assigneeName: '최예은', dueInDays: 7, completed: false },
  { title: '제출 전 최종 점검', assigneeName: null, dueInDays: 8, completed: false },
];

export function sampleMembers(): NewMember[] {
  return MEMBER_SEEDS.map((s) => ({
    name: s.name,
    color: colorFromName(s.name),
    roles: s.roles,
    availability: s.availability,
  }));
}

export function sampleTodoTitleToDue(seed: SampleTodoSeed): string | null {
  return seed.dueInDays === null ? null : dayjs().add(seed.dueInDays, 'day').format('YYYY-MM-DD');
}

// 데모 프로젝트 기본 마감일: 오늘 + 8일
export function sampleDeadline(): string {
  return dayjs().add(8, 'day').format('YYYY-MM-DD');
}
