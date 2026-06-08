import { Member, Role, ROLES } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 팀원 수와 역할 수가 달라도 자연스럽게 배정한다.
// - 팀원 ≥ 역할: 모두에게 1개씩, 모자라면 순환하여 중복 배정
// - 팀원 < 역할: 모든 역할을 팀원에게 라운드로빈 → 일부 팀원이 2개 이상
export function assignRoles(members: Member[]): Record<string, Role[]> {
  const result: Record<string, Role[]> = {};
  members.forEach((m) => (result[m.id] = []));
  if (members.length === 0) return result;

  const shuffledMembers = shuffle(members);
  const roles = [...ROLES];

  if (members.length >= roles.length) {
    shuffledMembers.forEach((m, i) => {
      result[m.id].push(roles[i % roles.length]);
    });
  } else {
    const shuffledRoles = shuffle(roles);
    shuffledRoles.forEach((role, j) => {
      const m = shuffledMembers[j % shuffledMembers.length];
      result[m.id].push(role);
    });
  }
  return result;
}
