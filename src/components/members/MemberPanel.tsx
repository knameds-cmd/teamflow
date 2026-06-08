import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import MemberCard from './MemberCard';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';

export default function MemberPanel() {
  const members = useStore((s) => s.members);
  const todos = useStore((s) => s.todos);
  const addMember = useStore((s) => s.addMember);
  const removeMember = useStore((s) => s.removeMember);

  const [name, setName] = useState('');
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);

  const todoCountByMember = useMemo(() => {
    const map: Record<string, number> = {};
    todos.forEach((t) => {
      if (t.assigneeId) map[t.assigneeId] = (map[t.assigneeId] ?? 0) + 1;
    });
    return map;
  }, [todos]);

  const handleAdd = async () => {
    try {
      await addMember(name);
      setName('');
      toast.success('팀원을 추가했어요');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '추가 실패');
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    await removeMember(pendingRemove.id);
    toast.success(`'${pendingRemove.name}' 님을 삭제했어요`);
    setPendingRemove(null);
  };

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          팀원 추가
        </label>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="팀원 이름 입력 후 Enter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-primary shrink-0" onClick={handleAdd}>
            <UserPlus size={16} /> 추가
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="팀원을 추가해 시작하세요" description="이름을 입력하면 팀원 카드가 생성됩니다." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              todoCount={todoCountByMember[m.id] ?? 0}
              onRemove={() => setPendingRemove({ id: m.id, name: m.name })}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="팀원을 삭제할까요?"
        message={`'${pendingRemove?.name}' 님의 역할·가능시간이 함께 삭제되고, 담당 할 일은 미배정으로 바뀝니다.`}
        confirmText="삭제"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
