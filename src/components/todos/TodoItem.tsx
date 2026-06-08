import { Check, Trash2 } from 'lucide-react';
import { Todo, Member } from '../../types';
import { deadlineLevel, daysUntil } from '../../lib/dday';
import Avatar from '../common/Avatar';

interface Props {
  todo: Todo;
  assignee: Member | null;
  onToggle: () => void;
  onRemove: () => void;
}

function dueBadge(dueDate: string | null, completed: boolean) {
  if (!dueDate) return null;
  const level = deadlineLevel(dueDate);
  const d = daysUntil(dueDate);
  if (completed) {
    return { text: dueDate.slice(5), cls: 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500' };
  }
  if (level === 'overdue') {
    return { text: '지남', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' };
  }
  if (level === 'soon') {
    return {
      text: d === 0 ? 'D-DAY' : `D-${d}`,
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    };
  }
  return { text: `D-${d}`, cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' };
}

export default function TodoItem({ todo, assignee, onToggle, onRemove }: Props) {
  const badge = dueBadge(todo.dueDate, todo.completed);

  return (
    <div className="group flex animate-fade-slide-in items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          todo.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 hover:border-primary dark:border-slate-600'
        }`}
      >
        {todo.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <span
        className={`flex-1 truncate text-sm ${
          todo.completed
            ? 'text-slate-400 line-through'
            : 'text-slate-800 dark:text-slate-100'
        }`}
      >
        {todo.title}
      </span>

      {assignee ? (
        <Avatar name={assignee.name} color={assignee.color} size={24} />
      ) : (
        <span className="pill bg-slate-100 text-slate-400 dark:bg-slate-700">미배정</span>
      )}

      {badge && <span className={`pill ${badge.cls}`}>{badge.text}</span>}

      <button
        onClick={onRemove}
        className="rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10"
        title="삭제"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
