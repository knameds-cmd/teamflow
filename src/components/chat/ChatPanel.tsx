import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Send, MessagesSquare } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { colorFromName, initialOf } from '../../lib/colors';
import EmptyState from '../common/EmptyState';

export default function ChatPanel() {
  const messages = useStore((s) => s.messages);
  const currentUser = useStore((s) => s.currentUser);
  const sendMessage = useStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    await sendMessage(t);
  };

  return (
    <div className="card flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
        <MessagesSquare size={18} className="text-primary" />
        <span className="font-semibold text-slate-800 dark:text-slate-100">팀 채팅</span>
        <span className="text-xs text-slate-400">· 팀원과 실시간 대화</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessagesSquare}
              title="아직 메시지가 없어요"
              description="첫 메시지를 남겨 팀원과 대화를 시작하세요."
            />
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.author === currentUser;
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: colorFromName(m.author) }}
                  title={m.author}
                >
                  {initialOf(m.author)}
                </span>
                <div className={`max-w-[75%] ${mine ? 'items-end text-right' : 'items-start'}`}>
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    {!mine && <span className="font-medium text-slate-500 dark:text-slate-300">{m.author}</span>}
                    <span>{dayjs(m.createdAt).format('A h:mm')}</span>
                  </div>
                  <div
                    className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? 'rounded-br-md bg-primary text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="flex items-center gap-2 border-t border-slate-200/80 p-3 dark:border-slate-800">
        <input
          className="input"
          placeholder="메시지를 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
        />
        <button
          className="btn-primary shrink-0 px-3"
          onClick={handleSend}
          disabled={!text.trim()}
          title="보내기"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
