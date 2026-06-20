import { useState } from 'react';
import { useStore } from '../store';
import type { ModuleType } from '../types';

const MODULE_ICONS: Record<string, string> = {
  lightbulb: '💡',
  users: '👥',
  'list-tree': '📋',
  film: '🎬',
  'message-circle': '💬',
};

export default function Sidebar() {
  const {
    projects,
    currentProject,
    modules,
    currentModule,
    aiSettings,
    imgSettings,
    vidSettings,
    selectProject,
    createProject,
    deleteProject,
    switchModule,
    toggleSettings,
  } = useStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const hasApiKey = aiSettings.apiKey.trim().length > 0;
  const hasImgKey = imgSettings.apiKey.trim().length > 0;
  const hasVidKey = vidSettings.apiKey.trim().length > 0;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createProject(newTitle.trim(), newGenre.trim());
    setNewTitle('');
    setNewGenre('');
    setShowNewProject(false);
  };

  const statusColor = (active: boolean) =>
    active ? 'bg-emerald-400/70 shadow-[0_0_6px_rgba(74,222,128,0.3)]' : 'bg-amber-400/50';

  return (
    <aside className="w-60 h-full flex flex-col flex-shrink-0 border-r border-white/[0.06] bg-black/20 backdrop-blur-md">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.06]">
        <span className="text-xl leading-none opacity-80">🎭</span>
        <div>
          <h1 className="font-serif text-base font-normal text-warm-title tracking-[0.04em]">
            剧本工坊
          </h1>
          <p className="text-[9px] text-white/25 tracking-[0.14em] uppercase mt-0.5">
            ScriptCraft AI
          </p>
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.12em]">
            项目
          </span>
          <button
            onClick={() => setShowNewProject(!showNewProject)}
            className="text-white/30 hover:text-white/60 text-lg leading-none w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-all"
            title="新建项目"
          >
            +
          </button>
        </div>

        {showNewProject && (
          <div className="mx-3 mb-3 p-3 glass-card-subtle space-y-2 animate-fade-in-down">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="片名…"
              className="w-full px-3 py-2 bg-white/[0.05] text-warm-title text-sm rounded-lg border border-white/[0.08] outline-none focus:border-accent-gold/40 transition-all placeholder:text-white/20"
              autoFocus
            />
            <input
              type="text"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="类型（悬疑/爱情/科幻…）"
              className="w-full px-3 py-2 bg-white/[0.05] text-warm-title text-sm rounded-lg border border-white/[0.08] outline-none focus:border-accent-gold/40 transition-all placeholder:text-white/20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 py-2 text-xs font-medium bg-warm-title/90 text-bg-base rounded-lg hover:bg-warm-title transition-all duration-200"
              >
                创建
              </button>
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 py-2 text-xs text-white/40 rounded-lg hover:bg-white/[0.05] transition-all duration-200"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-0.5 px-2">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => selectProject(p)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 border ${
                currentProject?.id === p.id
                  ? 'bg-white/[0.1] border-accent-gold/20 text-warm-title shadow-[0_0_12px_rgba(200,164,96,0.05)]'
                  : 'text-white/35 border-transparent hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[13px] flex-1 truncate leading-tight">{p.title}</span>
              {p.genre && (
                <span className="text-[9px] text-white/25 bg-white/[0.05] px-1.5 py-0.5 rounded-md truncate max-w-[60px]">
                  {p.genre}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`删除项目「${p.title}」？`)) deleteProject(p.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-accent-red/60 text-xs transition-all ml-0.5"
              >
                ✕
              </button>
            </div>
          ))}
          {projects.length === 0 && !showNewProject && (
            <p className="px-3 py-6 text-xs text-white/20 text-center leading-relaxed">
              点击 + 创建<br />第一个项目
            </p>
          )}
        </div>

        {/* Module Switcher */}
        {currentProject && (
          <>
            <div className="px-4 pt-7 pb-1.5">
              <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.12em]">
                创作模块
              </span>
            </div>
            <div className="px-2 space-y-0.5">
              {modules.map((m) => (
                <div
                  key={m.type}
                  onClick={() => switchModule(m.type as ModuleType)}
                  className={`module-tab ${
                    currentModule === m.type ? 'module-tab-active' : 'module-tab-inactive'
                  }`}
                >
                  <span className="text-base opacity-70">{MODULE_ICONS[m.icon] || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate leading-tight">{m.label}</div>
                    <div
                      className={`text-[9px] truncate ${
                        currentModule === m.type ? 'text-white/30' : 'text-white/15'
                      }`}
                    >
                      {m.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer — Settings */}
      <div className="border-t border-white/[0.06]">
        <button
          onClick={toggleSettings}
          className="w-full px-4 py-3 flex items-center gap-2.5 text-xs text-white/35 hover:text-white/65 hover:bg-white/[0.04] transition-all duration-200"
        >
          <span className="text-sm leading-none opacity-60">⚙️</span>
          <span className="flex-1 text-left">AI 设置</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${statusColor(hasApiKey)}`} title="文本大模型" />
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${statusColor(hasImgKey)}`} title="AI 生图" />
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${statusColor(hasVidKey)}`} title="AI 生视频" />
          </div>
        </button>
      </div>
    </aside>
  );
}
