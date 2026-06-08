import { useState, useEffect, useMemo } from 'react';
import { CalendarClock, Users, Eraser, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SlotKey } from '../../types';
import { recommendMeetingTimes } from '../../lib/meetingTime';
import AvailabilityGrid from './AvailabilityGrid';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';

export default function MeetingPanel() {
  const members = useStore((s) => s.members);
  const toggleSlot = useStore((s) => s.toggleSlot);
  const clearAvailability = useStore((s) => s.clearAvailability);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 팀원 목록이 바뀌면 선택값 보정
  useEffect(() => {
    if (members.length === 0) setSelectedId(null);
    else if (!members.some((m) => m.id === selectedId)) setSelectedId(members[0].id);
  }, [members, selectedId]);

  const selected = members.find((m) => m.id === selectedId) ?? null;

  const availabilityMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.availability])),
    [members],
  );
  const recommendations = useMemo(
    () => recommendMeetingTimes(members, availabilityMap),
    [members, availabilityMap],
  );

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="먼저 팀원을 추가하세요"
        description="팀원별 가능 시간을 입력하면 겹치는 회의 시간을 추천해 드려요."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 그리드 */}
      <div className="card space-y-4 p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            누구의 시간을 입력할까요?
          </label>
          <div className="flex items-center gap-2">
            <select
              className="input w-auto py-1.5"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              className="btn-ghost px-2"
              title="선택한 팀원 가능시간 비우기"
              onClick={() => selected && clearAvailability(selected.id)}
            >
              <Eraser size={16} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          셀을 클릭하거나 드래그해서 칠하세요. 색이 진할수록 가능한 인원이 많은 시간입니다.
        </p>

        <AvailabilityGrid
          members={members}
          selected={selected}
          onToggle={(slot: SlotKey) => selected && toggleSlot(selected.id, slot)}
        />
      </div>

      {/* 추천 Top3 */}
      <div className="card h-fit p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">추천 회의 시간</h3>
        </div>

        {recommendations.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400 dark:bg-slate-700/40">
            공통 가능 시간이 아직 없어요.
            <br />
            팀원들의 시간을 입력해 보세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {recommendations.map((rec, i) => {
              const recMembers = rec.memberIds
                .map((id) => members.find((m) => m.id === id))
                .filter(Boolean);
              return (
                <li
                  key={rec.slot}
                  className="rounded-xl border border-slate-100 p-3 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      {rec.slot.replace('-', '요일 ')}
                    </span>
                    <span className="pill bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {rec.count}명
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recMembers.map(
                      (m) => m && <Avatar key={m.id} name={m.name} color={m.color} size={24} />,
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <CalendarClock size={13} /> 2명 이상 겹치는 시간만 추천합니다.
        </div>
      </div>
    </div>
  );
}
