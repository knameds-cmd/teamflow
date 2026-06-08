import { Member, Todo } from '../../types';
import Avatar from '../common/Avatar';
import ProgressBar from './ProgressBar';

interface Props {
  members: Member[];
  todos: Todo[];
}

export default function MemberProgress({ members, todos }: Props) {
  return (
    <div className="space-y-3">
      {members.map((m) => {
        const mine = todos.filter((t) => t.assigneeId === m.id);
        const done = mine.filter((t) => t.completed).length;
        const percent = mine.length === 0 ? 0 : Math.round((done / mine.length) * 100);
        return (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar name={m.name} color={m.color} size={32} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{m.name}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {done}/{mine.length}
                </span>
              </div>
              <ProgressBar percent={percent} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
