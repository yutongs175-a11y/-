import { useStore } from '../store';
import { useState } from 'react';

export default function EmptyState() {
  const { createProject, toggleSettings } = useStore();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createProject(title.trim(), genre.trim());
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-transparent">
      <div className="text-center max-w-md px-8 animate-fade-in-up">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto glass-card flex items-center justify-center animate-breathe">
            <span className="text-3xl opacity-60">🎬</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl font-normal text-warm-title mb-3 tracking-[0.04em]">
          剧本工坊
        </h1>
        <p className="text-sm text-warm-body/60 leading-relaxed mb-8">
          AI 驱动的专业剧本创作工具<br />
          从灵感到成品，每一步都有智能辅助
        </p>

        {/* Create form */}
        <div className="glass-card p-6 space-y-3 text-left mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="你的剧本片名…"
            className="input-glass"
            autoFocus
          />
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="类型（可选）"
            className="input-glass"
          />
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="btn-glass-gold w-full justify-center"
          >
            开始创作
          </button>
        </div>

        {/* Config hint */}
        <button
          onClick={toggleSettings}
          className="text-xs text-white/20 hover:text-accent-gold/60 transition-colors"
        >
          ⚙️ 配置 AI 密钥以获得最佳体验
        </button>
      </div>
    </div>
  );
}
