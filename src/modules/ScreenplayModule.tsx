import { useStore } from '../store';
import { IMETextarea } from '../components/IMEInput';

/**
 * 剧本正文 — 标准剧本格式编辑器 · 玻璃拟态
 */
export default function ScreenplayModule() {
  const { moduleContents, saveContent } = useStore();
  const content = moduleContents.screenplay || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Format Guide Card */}
      <div className="glass-card p-6">
        <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em] mb-4">
          剧本格式指南
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-white/15 w-12 text-right font-mono">#场景</span>
            <span className="text-white/30">场号. 地点 — 时间</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/15 w-12 text-right font-mono">角色名</span>
            <span className="text-white/30">角色对白前置于行首</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/15 w-12 text-right font-mono">描述</span>
            <span className="text-white/30">动作和画面描述段落</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/15 w-12 text-right font-mono">(括号)</span>
            <span className="text-white/30">情绪/动作提示</span>
          </div>
        </div>
      </div>

      {/* Screenplay Editor */}
      <div className="glass-card overflow-hidden">
        <div className="px-7 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">剧本正文</h3>
          <span className="text-[10px] text-white/20">自动保存 · 标准剧本格式</span>
        </div>
        <IMETextarea
          value={content}
          onValueChange={(v) => saveContent(v)}
          className="w-full h-[550px] bg-transparent outline-none resize-none font-mono text-[14px] text-warm-body/70 leading-[1.8] px-7 py-6 placeholder:text-white/12"
          placeholder={`开始创作你的剧本——

#1. 内景 公寓 — 夜

城市霓虹透过百叶窗在墙上投下条纹阴影。桌上摊着散乱的图纸和半杯凉掉的咖啡。

主角
（望着窗外）
有些事，一旦开始就回不了头。

坐在角落的配角抬起头，眼神复杂。`}
        />
      </div>
    </div>
  );
}
