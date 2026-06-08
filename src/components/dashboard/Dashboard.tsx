import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  AlarmClock,
  Trophy,
  Trash2,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { deadlineLevel, getDDay, daysUntil } from '../../lib/dday';
import { recommendMeetingTimes } from '../../lib/meetingTime';
import ProgressBar from './ProgressBar';
import MemberProgress from './MemberProgress';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';

export default function Dashboard() {
  const members = useStore((s) => s.members);
  const todos = useStore((s) => s.todos);
  const projectDeadline = useStore((s) => s.projectDeadline);
  const resetAll = useStore((s) => s.resetAll);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [confirmReset, setConfirmReset] = useState(false);

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const incomplete = total - completed;
  const soon = todos.filter(
    (t) => !t.completed && ['soon', 'overdue'].includes(deadlineLevel(t.dueDate)),
  ).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const availabilityMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.availability])),
    [members],
  );
  const topMeeting = useMemo(
    () => recommendMeetingTimes(members, availabilityMap, 1)[0] ?? null,
    [members, availabilityMap],
  );

  const dday = getDDay(projectDeadline);
  const ddayLeft = daysUntil(projectDeadline);

  const isEmpty = members.length === 0 && todos.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="아직 데이터가 없어요"
        description="팀원을 추가하면 진행 상황이 여기에 나타납니다."
        action={
          <button className="btn-primary" onClick={() => setActiveTab('members')}>
            <Users size={16} /> 팀원 추가하러 가기
          </button>
        }
      />
    );
  }

  const handleReset = async () => {
    await resetAll();
    toast.success('전체 데이터를 초기화했어요');
    setConfirmReset(false);
  };

  return (
    <div className="space-y-5">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={ListTodo} label="전체 할 일" value={total} tone="slate" />
        <SummaryCard icon={CheckCircle2} label="완료" value={completed} tone="emerald" />
        <SummaryCard icon={Circle} label="미완료" value={incomplete} tone="indigo" />
        <SummaryCard icon={AlarmClock} label="마감 임박" value={soon} tone="amber" />
      </div>

      {/* 전체 진행률 + D-Day */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-end justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">전체 진행률</h3>
            <span className="text-2xl font-extrabold text-primary">{percent}%</span>
          </div>
          <ProgressBar percent={percent} className="h-3.5" />
          <p className="mt-2 text-xs text-slate-400">
            {completed} / {total} 완료
          </p>
        </div>

        <div className="card flex flex-col justify-center p-5">
          <p className="text-xs font-semibold text-slate-400">마감까지</p>
          <p
            className={`mt-1 text-3xl font-extrabold ${
              ddayLeft !== null && ddayLeft < 0
                ? 'text-red-500'
                : ddayLeft !== null && ddayLeft <= 3
                  ? 'text-amber-500'
                  : 'text-slate-800 dark:text-white'
            }`}
          >
            {dday}
          </p>
          {topMeeting && (
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <Trophy size={12} className="text-amber-500" /> 추천 회의: {topMeeting.slot.replace('-', ' ')} ({topMeeting.count}명)
            </p>
          )}
        </div>
      </div>

      {/* 팀원별 진행률 */}
      <div className="card p-5">
        <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">팀원별 진행률</h3>
        {members.length === 0 ? (
          <button className="btn-secondary" onClick={() => setActiveTab('members')}>
            팀원 추가하러 가기
          </button>
        ) : (
          <MemberProgress members={members} todos={todos} />
        )}
      </div>

      {/* 초기화 */}
      <div className="flex justify-end">
        <button className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => setConfirmReset(true)}>
          <Trash2 size={15} /> 전체 초기화
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="전체 데이터를 초기화할까요?"
        message="이 프로젝트의 모든 팀원과 할 일이 삭제됩니다. 되돌릴 수 없어요."
        confirmText="전체 삭제"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

const TONES: Record<string, string> = {
  slate: 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300',
  emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300',
  indigo: 'text-primary bg-primary-50 dark:bg-primary/15 dark:text-primary-300',
  amber: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300',
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ListTodo;
  label: string;
  value: number;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-extrabold leading-none text-slate-800 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
