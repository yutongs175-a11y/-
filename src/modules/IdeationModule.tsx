import { useStore } from '../store';
import { IMEInput, IMETextarea } from '../components/IMEInput';

/**
 * 灵感工坊 — 极简电影感玻璃拟态
 */
export default function IdeationModule() {
  const { moduleContents, saveContent, currentProject, updateProject } = useStore();
  const content = moduleContents.ideation || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Info Card */}
      <div className="glass-card p-7 space-y-5">
        <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">项目信息</h3>

        <div>
          <label className="block text-[11px] text-white/30 mb-2 font-medium tracking-[0.03em]">片名</label>
          <IMEInput
            type="text"
            value={currentProject?.title || ''}
            onChange={(e) => updateProject(currentProject!.id, { title: e.target.value })}
            className="input-glass font-serif"
            placeholder="给你的故事起个名字…"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/30 mb-2 font-medium tracking-[0.03em]">
            一句话梗概 (Logline)
          </label>
          <IMETextarea
            value={currentProject?.logline || ''}
            onChange={(e) => updateProject(currentProject!.id, { logline: e.target.value })}
            className="textarea-glass"
            rows={3}
            placeholder="用一句话概括你的故事：谁，在什么处境下，为了什么目标，面临什么障碍…"
          />
          <p className="text-[10px] text-white/20 mt-1.5">
            好的 Logline = 主角 + 目标 + 障碍 + 风险
          </p>
        </div>
      </div>

      {/* Free Notes Editor */}
      <div className="glass-card overflow-hidden">
        <div className="px-7 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">灵感笔记</h3>
          <span className="text-[10px] text-white/20">自动保存</span>
        </div>
        <IMETextarea
          value={content}
          onChange={(e) => saveContent(e.target.value)}
          className="w-full h-[420px] bg-transparent outline-none resize-none font-serif text-warm-body/80 leading-relaxed text-[14px] px-7 py-6 placeholder:text-white/12"
          placeholder={`在这里记录你的一切灵感火花——

· 脑海中的画面
· 想表达的主题
· 喜欢的参考影片
· 角色的雏形
· 可能的故事走向

不要在意格式，让思绪自由流动。右侧的 AI 助手随时可以帮你整理和拓展。`}
        />
      </div>
    </div>
  );
}
