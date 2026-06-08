import { Member, SlotKey, DAYS, TIMES, Day, Time } from '../types';

export interface Recommendation {
  slot: SlotKey;
  count: number;
  memberIds: string[];
}

// 슬롯의 정렬 우선순위 (요일 → 시간 빠른 순). 동률 타이브레이크에 사용.
function slotOrder(slot: SlotKey): number {
  const [day, time] = slot.split('-') as [Day, Time];
  const di = DAYS.indexOf(day);
  const ti = TIMES.indexOf(time);
  return di * TIMES.length + ti;
}

// 가능 인원이 많이 겹치는 회의 시간 Top N (2명 이상만).
export function recommendMeetingTimes(
  members: Member[],
  availability: Record<string, SlotKey[]>,
  topN = 3,
): Recommendation[] {
  const tally: Record<string, string[]> = {};
  members.forEach((m) => {
    (availability[m.id] ?? []).forEach((slot) => {
      (tally[slot] ??= []).push(m.id);
    });
  });

  return Object.entries(tally)
    .map(([slot, memberIds]) => ({ slot: slot as SlotKey, count: memberIds.length, memberIds }))
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count || slotOrder(a.slot) - slotOrder(b.slot))
    .slice(0, topN);
}

// 그리드 히트맵용: 슬롯별 가능 인원 수 맵.
export function slotCounts(
  members: Member[],
  availability: Record<string, SlotKey[]>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  members.forEach((m) => {
    (availability[m.id] ?? []).forEach((slot) => {
      counts[slot] = (counts[slot] ?? 0) + 1;
    });
  });
  return counts;
}
