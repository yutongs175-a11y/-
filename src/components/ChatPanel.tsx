import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';

interface LocalMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPanel() {
  const {
    currentProject,
    currentModule,
    moduleContents,
    saveContent,
    aiSettings,
    toggleSettings,
  } = useStore();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const projectId = currentProject?.id || '';
  const moduleType = currentModule || '';
  const hasAI = aiSettings.apiKey.trim().length > 0;

  useEffect(() => {
    setMessages([]);
    setInput('');
    setStreamingContent('');
  }, [moduleType, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !currentProject) return;

    if (!hasAI) {
      toggleSettings();
      return;
    }

    const userMsg: LocalMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreamingContent('');

    let fullContent = '';

    try {
      const controller = api.chatStream(projectId, moduleType, text, {
        onDelta: (token) => {
          fullContent += token;
          setStreamingContent(fullContent);
        },
        onDone: () => {
          const assistantMsg: LocalMessage = { role: 'assistant', content: fullContent };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');
          const current = moduleContents[moduleType] || '';
          saveContent(current ? current + '\n\n' + fullContent.trim() : fullContent.trim());
        },
        onError: (err) => {
          setStreamingContent('');
          const errorMsg: LocalMessage = { role: 'assistant', content: `❌ ${err}` };
          setMessages((prev) => [...prev, errorMsg]);
        },
      });
      abortRef.current = controller;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStreamingContent('');
        setMessages((prev) => [...prev, { role: 'assistant', content: `❌ ${err.message || '请求失败'}` }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
    if (streamingContent) {
      setMessages((prev) => [...prev, { role: 'assistant', content: streamingContent }]);
    }
    setStreamingContent('');
  };

  return (
    <aside className="w-[420px] flex flex-col flex-shrink-0 border-l border-white/[0.06] bg-black/15 backdrop-blur-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.03em]">
          AI 助手
        </h3>
        {!hasAI && (
          <button
            onClick={toggleSettings}
            className="text-[11px] text-accent-gold/70 hover:text-accent-gold transition-colors"
          >
            配置密钥 →
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-3xl mb-3 opacity-40">🎬</p>
            <p className="text-sm text-white/25 leading-relaxed">
              {hasAI
                ? '输入你的创作想法，AI 将协助你完成剧本创作'
                : '请先点击右上角配置 AI 密钥'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
          >
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="chat-bubble-ai">
              <div className="whitespace-pre-wrap typing-cursor">{streamingContent}</div>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-gold/40 animate-breathe" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-gold/40 animate-breathe" style={{ animationDelay: '0.3s' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-gold/40 animate-breathe" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={hasAI ? '输入创作指令…' : '请先配置 AI 密钥'}
            rows={2}
            className="flex-1 resize-none px-3 py-2.5 bg-white/[0.05] backdrop-blur-md text-warm-title text-sm rounded-[10px] border border-white/[0.08] outline-none focus:border-accent-gold/30 focus:bg-white/[0.08] transition-all placeholder:text-white/15"
          />
          <button
            onClick={loading ? handleStop : handleSend}
            disabled={!input.trim() && !loading}
            className={`self-end px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
              loading
                ? 'bg-accent-red/30 text-white border border-accent-red/20 hover:bg-accent-red/40'
                : 'bg-white/[0.08] text-warm-title border border-white/[0.12] hover:bg-white/[0.14] hover:border-white/[0.2] disabled:opacity-25 disabled:cursor-not-allowed'
            }`}
          >
            {loading ? '停止' : '发送'}
          </button>
        </div>
      </div>
    </aside>
  );
}
