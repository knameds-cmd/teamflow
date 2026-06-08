import { useEffect, useRef, useState } from 'react';
import { DAYS, TIMES, SlotKey, Member } from '../../types';

interface Props {
  members: Member[];
  selected: Member | null;
  onToggle: (slot: SlotKey, mode: 'add' | 'remove') => void;
}

// 각 셀: 배경 농도 = 가능 인원 수, 선택된 팀원이 가능하면 그 사람 색 테두리 표시.
// 클릭/드래그로 선택된 팀원의 가능 시간을 칠한다(When2meet 스타일).
export default function AvailabilityGrid({ members, selected, onToggle }: Props) {
  const total = members.length || 1;
  const counts: Record<string, number> = {};
  members.forEach((m) => m.availability.forEach((s) => (counts[s] = (counts[s] ?? 0) + 1)));

  const selectedSlots = new Set(selected?.availability ?? []);

  const [dragging, setDragging] = useState(false);
  const paintMode = useRef<'add' | 'remove'>('add');

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const apply = (slot: SlotKey) => {
    if (!selected) return;
    const has = selectedSlots.has(slot);
    if (paintMode.current === 'add' && !has) onToggle(slot, 'add');
    if (paintMode.current === 'remove' && has) onToggle(slot, 'remove');
  };

  const onCellDown = (slot: SlotKey) => {
    if (!selected) return;
    paintMode.current = selectedSlots.has(slot) ? 'remove' : 'add';
    setDragging(true);
    apply(slot);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid select-none gap-0.5" style={{ gridTemplateColumns: `auto repeat(${DAYS.length}, minmax(36px, 1fr))` }}>
        {/* 헤더 행 */}
        <div />
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            {d}
          </div>
        ))}

        {/* 시간 행 */}
        {TIMES.map((time) => (
          <Row
            key={time}
            time={time}
            counts={counts}
            total={total}
            selectedSlots={selectedSlots}
            selectedColor={selected?.color}
            onDown={onCellDown}
            onEnter={(slot) => dragging && apply(slot)}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  time,
  counts,
  total,
  selectedSlots,
  selectedColor,
  onDown,
  onEnter,
}: {
  time: string;
  counts: Record<string, number>;
  total: number;
  selectedSlots: Set<string>;
  selectedColor?: string;
  onDown: (slot: SlotKey) => void;
  onEnter: (slot: SlotKey) => void;
}) {
  return (
    <>
      <div className="pr-2 text-right text-[11px] leading-7 text-slate-400">{time}</div>
      {DAYS.map((day) => {
        const slot = `${day}-${time}` as SlotKey;
        const count = counts[slot] ?? 0;
        const intensity = count / total;
        const isMine = selectedSlots.has(slot);
        return (
          <button
            key={slot}
            onMouseDown={() => onDown(slot)}
            onMouseEnter={() => onEnter(slot)}
            title={`${slot} · ${count}명 가능`}
            className="h-7 rounded-[5px] border border-slate-100 transition-colors dark:border-slate-700/50"
            style={{
              backgroundColor: count > 0 ? `rgba(99,102,241,${0.15 + intensity * 0.75})` : undefined,
              boxShadow: isMine && selectedColor ? `inset 0 0 0 2px ${selectedColor}` : undefined,
            }}
          />
        );
      })}
    </>
  );
}
