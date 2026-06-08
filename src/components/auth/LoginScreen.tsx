import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, Cloud, HardDrive } from 'lucide-react';
import { useStore } from '../../store/useStore';

// 이름 + 4자리 PIN 로그인. 처음 보는 이름이면 입력한 PIN으로 새로 등록되고,
// 다음부터는 같은 PIN을 맞춰야 입장할 수 있다(이름 사칭 방지용 경량 보호).
export default function LoginScreen() {
  const login = useStore((s) => s.login);
  const storageMode = useStore((s) => s.storageMode);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN은 숫자 4자리예요');
      return;
    }
    setBusy(true);
    try {
      const { created } = await login(name, pin);
      toast.success(created ? `${name.trim()} 님, PIN을 등록했어요` : `${name.trim()} 님 환영해요`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '로그인에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm animate-fade-slide-in">
        {/* 로고 / 워드마크 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            TeamFlow
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            팀플의 모든 것을 한 곳에서.
            <br />
            이름으로 시작해 내 프로젝트를 한눈에 관리하세요.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="label">내 이름</label>
            <input
              className="input"
              placeholder="예: 홍길동"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && handleLogin()}
            />
          </div>

          <div className="space-y-2">
            <label className="label">PIN (숫자 4자리)</label>
            <input
              className="input tracking-[0.5em]"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && !busy && handleLogin()}
            />
          </div>

          <button className="btn-primary w-full" onClick={handleLogin} disabled={busy}>
            들어가기 <ArrowRight size={18} />
          </button>

          <p className="px-1 text-xs leading-relaxed text-slate-400">
            처음 보는 이름이면 입력한 PIN으로 새로 등록돼요. 다음부터 같은 이름·PIN으로
            들어옵니다. 팀원과 같은 프로젝트 코드를 공유하면 함께 볼 수 있어요.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          {storageMode === 'firebase' ? (
            <>
              <Cloud size={13} /> 클라우드 실시간 모드
            </>
          ) : (
            <>
              <HardDrive size={13} /> 로컬 저장 모드 (이 브라우저에 저장)
            </>
          )}
        </div>
      </div>
    </div>
  );
}
