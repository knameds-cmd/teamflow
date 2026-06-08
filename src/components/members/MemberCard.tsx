import { X } from 'lucide-react';
import { Member } from '../../types';
import Avatar from '../common/Avatar';

interface Props {
  member: Member;
  todoCount: number;
  onRemove: () => void;
}

export default function MemberCard({ member, todoCount, onRemove }: Props) {
  return (
    <div className="card group relative animate-fade-slide-in p-4">
      <button
        className="absolute right-2 top-2 rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10"
        onClick={onRemove}
        title="팀원 삭제"
      >
        <X size={16} />
      </button>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} color={member.color} size={44} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{member.name}</p>
          <p className="text-xs text-slate-400">담당 할 일 {todoCount}개</p>
        </div>
      </div>
      {member.roles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {member.roles.map((role) => (
            <span
              key={role}
              className="pill bg-primary-50 text-primary-700 dark:bg-primary/15 dark:text-primary-300"
            >
              {role}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
