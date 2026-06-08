import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, ListTodo } from 'lucide-react';
import { useStore } from '../../store/useStore';
import TodoItem from './TodoItem';
import EmptyState from '../common/EmptyState';

function sortByDue<T extends { dueDate: string | null; createdAt: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1; // 마감 있는 항목 먼저
    if (b.dueDate) return 1;
    return a.createdAt - b.createdAt;
  });
}

export default function TodoPanel() {
  const todos = useStore((s) => s.todos);
  const members = useStore((s) => s.members);
  const addTodo = useStore((s) => s.addTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const removeTodo = useStore((s) => s.removeTodo);

  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const active = useMemo(() => sortByDue(todos.filter((t) => !t.completed)), [todos]);
  const done = useMemo(() => todos.filter((t) => t.completed), [todos]);

  const handleAdd = async () => {
    try {
      await addTodo({
        title,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      setTitle('');
      setDueDate('');
      toast.success('할 일을 추가했어요');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '추가 실패');
    }
  };

  return (
    <div className="space-y-5">
      <div className="card space-y-2 p-4">
        <input
          className="input"
          placeholder="할 일 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-auto flex-1"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">미배정</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input w-auto flex-1"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button className="btn-primary shrink-0" onClick={handleAdd}>
            <Plus size={16} /> 추가
          </button>
        </div>
      </div>

      {todos.length === 0 ? (
        <EmptyState icon={ListTodo} title="할 일이 없어요" description="첫 할 일을 추가해 보세요." />
      ) : (
        <>
          <section>
            <h3 className="mb-2 px-1 text-sm font-bold text-slate-600 dark:text-slate-300">
              미완료 <span className="text-slate-400">({active.length})</span>
            </h3>
            <div className="space-y-2">
              {active.length === 0 ? (
                <p className="px-1 text-sm text-slate-400">모든 할 일을 완료했어요! 🎉</p>
              ) : (
                active.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    assignee={t.assigneeId ? (memberById.get(t.assigneeId) ?? null) : null}
                    onToggle={() => toggleTodo(t.id)}
                    onRemove={() => removeTodo(t.id)}
                  />
                ))
              )}
            </div>
          </section>

          {done.length > 0 && (
            <section>
              <h3 className="mb-2 px-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                완료 <span className="text-slate-400">({done.length})</span>
              </h3>
              <div className="space-y-2">
                {done.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    assignee={t.assigneeId ? (memberById.get(t.assigneeId) ?? null) : null}
                    onToggle={() => toggleTodo(t.id)}
                    onRemove={() => removeTodo(t.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
