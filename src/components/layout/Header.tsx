import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Moon, Sun, Link2, Cloud, HardDrive } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getDDay, daysUntil } from '../../lib/dday';

export default function Header() {
  const projectCode = useStore((s) => s.projectCode)!;
  const projectName = useStore((s) => s.projectName);
  const projectDeadline = useStore((s) => s.projectDeadline);
  const currentUser = useStore((s) => s.currentUser);
  const darkMode = useStore((s) => s.darkMode);
  const storageMode = useStore((s) => s.storageMode);
  const setProjectName = useStore((s) => s.setProjectName);
  const setProjectDeadline = useStore((s) => s.setProjectDeadline);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const goHome = useStore((s) => s.goHome);

  const [nameDraft, setNameDraft] = useState(projectName);
  useEffect(() => setNameDraft(projectName), [projectName]);

  const dday = getDDay(projectDeadline);
  const left = daysUntil(projectDeadline);
  const ddayClass =
    left === null
      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
      : left < 0
        ? 'bg-primary-100 text-primary-700 dark:bg-primary/20 dark:text-primary-300'
        : left <= 3
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  const copyInvite = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('p', projectCode);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success('초대 링크를 복사했어요');
    } catch {
      toast(url.toString());
    }
  };

  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    window.history.replaceState({}, '', url);
    goHome();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* 뒤로(프로젝트 목록) + 프로젝트명 */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              className="btn-ghost shrink-0 px-2"
              onClick={handleBack}
              title="내 프로젝트 목록으로"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <input
                className="w-full truncate bg-transparent text-lg font-semibold tracking-tight text-slate-900 outline-none focus:underline dark:text-white"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => nameDraft !== projectName && setProjectName(nameDraft)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                placeholder="프로젝트 이름"
              />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {storageMode === 'firebase' ? <Cloud size={11} /> : <HardDrive size={11} />}
                <span className="font-mono tracking-wider">{projectCode}</span>
                {currentUser && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{currentUser}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* D-Day */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              value={projectDeadline ?? ''}
              onChange={(e) => setProjectDeadline(e.target.value || null)}
            />
            <span className={`pill px-3 py-1 text-sm ${ddayClass}`}>{dday}</span>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-1">
            <button className="btn-ghost px-2" onClick={copyInvite} title="초대 링크 복사">
              <Link2 size={18} />
            </button>
            <button className="btn-ghost px-2" onClick={toggleDarkMode} title="다크모드 전환">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
