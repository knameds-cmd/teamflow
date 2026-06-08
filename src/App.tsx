import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { normalizeCode, isValidCode } from './lib/projectCode';
import LoginScreen from './components/auth/LoginScreen';
import HomeScreen from './components/home/HomeScreen';
import Header from './components/layout/Header';
import TabNav from './components/layout/TabNav';
import Dashboard from './components/dashboard/Dashboard';
import MemberPanel from './components/members/MemberPanel';
import RolePanel from './components/roles/RolePanel';
import MeetingPanel from './components/meeting/MeetingPanel';
import TodoPanel from './components/todos/TodoPanel';
import ChatPanel from './components/chat/ChatPanel';

export default function App() {
  const currentUser = useStore((s) => s.currentUser);
  const projectCode = useStore((s) => s.projectCode);
  const darkMode = useStore((s) => s.darkMode);
  const loading = useStore((s) => s.loading);
  const activeTab = useStore((s) => s.activeTab);
  const openProject = useStore((s) => s.openProject);
  const refreshHomeProjects = useStore((s) => s.refreshHomeProjects);

  // 다크모드 → <html>에 class 토글
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // 로그인 후 최초 진입: URL ?p={code}가 있으면 그 프로젝트로, 없으면 홈 목록 새로고침.
  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const urlCode = normalizeCode(params.get('p') ?? '');
    const code = isValidCode(urlCode) ? urlCode : useStore.getState().projectCode;
    if (code) openProject(code);
    else refreshHomeProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{ className: 'dark:!bg-slate-800 dark:!text-slate-100' }}
      />
      {!currentUser ? (
        <LoginScreen />
      ) : !projectCode ? (
        <HomeScreen />
      ) : (
        <div className="min-h-screen">
          <Header />
          <TabNav />
          <main className="mx-auto max-w-5xl px-4 py-6">
            {loading ? (
              <LoadingState />
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'members' && <MemberPanel />}
                {activeTab === 'roles' && <RolePanel />}
                {activeTab === 'meeting' && <MeetingPanel />}
                {activeTab === 'todos' && <TodoPanel />}
                {activeTab === 'chat' && <ChatPanel />}
              </>
            )}
          </main>
        </div>
      )}
    </>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
