import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  ArrowRight,
  Users,
  CheckCircle2,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  X,
  FolderOpen,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { normalizeCode, isValidCode } from '../../lib/projectCode';
import { getDDay, daysUntil } from '../../lib/dday';
import ProgressBar from '../dashboard/ProgressBar';
import EmptyState from '../common/EmptyState';

function setUrlCode(code: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('p', code);
  window.history.replaceState({}, '', url);
}

export default function HomeScreen() {
  const currentUser = useStore((s) => s.currentUser)!;
  const homeProjects = useStore((s) => s.homeProjects);
  const homeLoading = useStore((s) => s.homeLoading);
  const darkMode = useStore((s) => s.darkMode);
  const createProject = useStore((s) => s.createProject);
  const createSampleProject = useStore((s) => s.createSampleProject);
  const joinProject = useStore((s) => s.joinProject);
  const openProject = useStore((s) => s.openProject);
  const removeFromHome = useStore((s) => s.removeFromHome);
  const logout = useStore((s) => s.logout);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const c = await createProject(name);
      setUrlCode(c);
      setName('');
      setShowCreate(false);
      toast.success('프로젝트를 만들었어요!');
    } catch {
      toast.error('프로젝트 생성에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    const c = normalizeCode(code);
    if (!isValidCode(c)) {
      toast.error('6자리 코드를 정확히 입력하세요');
      return;
    }
    setBusy(true);
    try {
      await joinProject(c);
      setUrlCode(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '참여에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  const handleSample = async () => {
    setBusy(true);
    try {
      const c = await toast.promise(createSampleProject(), {
        loading: '샘플 프로젝트를 만드는 중...',
        success: '샘플 프로젝트를 만들었어요',
        error: '샘플 생성 실패',
      });
      setUrlCode(c);
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async (c: string) => {
    await openProject(c);
    setUrlCode(c);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 상단 바 */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              T
            </div>
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white">
              TeamFlow
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-sm text-slate-500 dark:text-slate-400">
              <b className="font-semibold text-slate-700 dark:text-slate-200">{currentUser}</b> 님
            </span>
            <button className="btn-ghost px-2" onClick={toggleDarkMode} title="다크모드 전환">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-ghost px-2" onClick={logout} title="로그아웃">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              내 프로젝트
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              참여 중인 팀플의 진행 상황을 한눈에 보고 들어가세요.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={16} /> 새 프로젝트
          </button>
        </div>

        {/* 새 프로젝트 만들기 / 코드로 참여 */}
        {showCreate && (
          <div className="card mb-6 animate-fade-slide-in space-y-5 p-5">
            <div>
              <label className="label">새 프로젝트 만들기</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="프로젝트 이름 (예: 캡스톤 4팀)"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !busy && handleCreate()}
                />
                <button className="btn-primary shrink-0" onClick={handleCreate} disabled={busy}>
                  만들기
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              또는 초대 코드로 참여
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-2">
              <input
                className="input font-mono uppercase tracking-widest"
                placeholder="예: AB12CD"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && !busy && handleJoin()}
              />
              <button className="btn-secondary shrink-0" onClick={handleJoin} disabled={busy}>
                <ArrowRight size={16} /> 참여
              </button>
            </div>
          </div>
        )}

        {/* 프로젝트 목록 */}
        {homeLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : homeProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="아직 프로젝트가 없어요"
            description="새 프로젝트를 만들거나, 처음이라면 샘플로 둘러보세요."
            action={
              <button className="btn-secondary" onClick={handleSample} disabled={busy}>
                <Sparkles size={16} /> 샘플 프로젝트 둘러보기
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {homeProjects.map(({ code: c, stats }) => {
              const pct =
                stats.totalTodos === 0 ? 0 : Math.round((stats.doneTodos / stats.totalTodos) * 100);
              const left = daysUntil(stats.meta.projectDeadline);
              const ddayTone =
                left === null
                  ? 'text-slate-400'
                  : left < 0
                    ? 'text-primary-600 dark:text-primary-400'
                    : left <= 3
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400';
              return (
                <div
                  key={c}
                  className="card group relative cursor-pointer p-5 transition-colors hover:border-primary/40"
                  onClick={() => handleOpen(c)}
                >
                  <button
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 dark:hover:bg-slate-800"
                    title="목록에서 제거"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHome(c);
                    }}
                  >
                    <X size={15} />
                  </button>

                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                        {stats.meta.projectName || '이름 없는 프로젝트'}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-mono tracking-wider">{c}</span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} /> {stats.memberCount}명
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {stats.doneTodos}/{stats.totalTodos}
                        </span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${ddayTone}`}>
                      {getDDay(stats.meta.projectDeadline)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar percent={pct} />
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 샘플 둘러보기 (목록이 있을 때도 하단에 작게) */}
            <button
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-3 text-sm text-slate-400 transition hover:border-primary/40 hover:text-primary dark:border-slate-700"
              onClick={handleSample}
              disabled={busy}
            >
              <Sparkles size={15} /> 샘플 프로젝트 둘러보기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
