import {
  LayoutDashboard,
  Users,
  Shuffle,
  CalendarClock,
  ListTodo,
  MessagesSquare,
  LucideIcon,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'members', label: '팀원', icon: Users },
  { key: 'roles', label: '역할', icon: Shuffle },
  { key: 'meeting', label: '회의시간', icon: CalendarClock },
  { key: 'todos', label: '할 일', icon: ListTodo },
  { key: 'chat', label: '채팅', icon: MessagesSquare },
];

export default function TabNav() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <nav className="sticky top-[57px] z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 sm:px-4">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
