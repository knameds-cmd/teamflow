import dayjs from 'dayjs';

export function getDDay(deadline: string | null): string {
  if (!deadline) return '마감일 미설정';
  const today = dayjs().startOf('day');
  const target = dayjs(deadline).startOf('day');
  const diff = target.diff(today, 'day');
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-DAY';
  return '마감일이 지났습니다';
}

// 남은 일수 (음수면 지남, null이면 미설정)
export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = dayjs().startOf('day');
  const target = dayjs(deadline).startOf('day');
  return target.diff(today, 'day');
}

export type DeadlineLevel = 'none' | 'normal' | 'soon' | 'overdue';

// 마감 임박(0~3일) → soon, 지남 → overdue
export function deadlineLevel(deadline: string | null): DeadlineLevel {
  const d = daysUntil(deadline);
  if (d === null) return 'none';
  if (d < 0) return 'overdue';
  if (d <= 3) return 'soon';
  return 'normal';
}
