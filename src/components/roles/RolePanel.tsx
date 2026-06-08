import toast from 'react-hot-toast';
import { Shuffle, RefreshCw, Eraser, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ROLES } from '../../types';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';

export default function RolePanel() {
  const members = useStore((s) => s.members);
  const assignRolesAuto = useStore((s) => s.assignRolesAuto);
  const clearRoles = useStore((s) => s.clearRoles);

  const hasMembers = members.length > 0;
  const anyAssigned = members.some((m) => m.roles.length > 0);

  const handleAssign = async () => {
    await assignRolesAuto();
    toast.success('역할을 배정했어요');
  };

  const handleClear = async () => {
    await clearRoles();
    toast.success('역할을 초기화했어요');
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">역할 자동 분배</p>
          <p className="text-xs text-slate-400">
            팀원 {members.length}명 · 역할 {ROLES.length}개를 균형 있게 나눕니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={handleAssign} disabled={!hasMembers}>
            {anyAssigned ? <RefreshCw size={16} /> : <Shuffle size={16} />}
            {anyAssigned ? '다시 섞기' : '자동 배정'}
          </button>
          <button className="btn-secondary" onClick={handleClear} disabled={!anyAssigned}>
            <Eraser size={16} /> 초기화
          </button>
        </div>
      </div>

      {!hasMembers ? (
        <EmptyState icon={Users} title="먼저 팀원을 추가하세요" description="팀원이 있어야 역할을 배정할 수 있어요." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-4">
              <Avatar name={m.name} color={m.color} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{m.name}</p>
                {m.roles.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.roles.map((r) => (
                      <span
                        key={r}
                        className="pill bg-primary-50 text-primary-700 dark:bg-primary/15 dark:text-primary-300"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">아직 역할 없음</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
