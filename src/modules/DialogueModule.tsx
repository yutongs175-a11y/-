import { useStore } from '../store';
import { IMETextarea } from '../components/IMEInput';

/**
 * 对白润色 — 台词精炼润色 · 玻璃拟态
 */
export default function DialogueModule() {
  const { moduleContents, saveContent } = useStore();
  const content = moduleContents.dialogue || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tips Card */}
      <div className="glass-card p-6">
        <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em] mb-4">
          对白打磨要点
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
          {[
            { label: '潜台词', desc: '角色真正想说的往往没说出口' },
            { label: '角色声音', desc: '每个角色有独特的说话节奏和用词' },
            { label: '冲突驱动', desc: '好的对白推动剧情，不为说而说' },
            { label: '简洁有力', desc: '删掉所有可以删的，保留必须有的' },
          ].map((tip) => (
            <div key={tip.label} className="flex items-start gap-2">
              <span className="text-accent-gold/60 mt-0.5">·</span>
              <div>
                <span className="text-white/30 font-medium">{tip.label}</span>
                <span className="text-white/18 ml-2">{tip.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogue Editor */}
      <div className="glass-card overflow-hidden">
        <div className="px-7 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">对白编辑</h3>
          <span className="text-[10px] text-white/20">自动保存</span>
        </div>
        <IMETextarea
          value={content}
          onChange={(e) => saveContent(e.target.value)}
          className="w-full h-[500px] bg-transparent outline-none resize-none font-serif text-[14px] text-warm-body/70 leading-[1.8] px-7 py-6 placeholder:text-white/12"
          placeholder={`将需要润色的对白段落粘贴在这里——

角色A：
我还以为你再也不会回来了。这么些年，我每天都盼着门会被推开。

角色B：
（低头）
我没想过回来。只是……碰巧路过。

角色A：
碰巧路过？这座城市有八百万人，你就碰巧路过我家楼下？

可以让右侧 AI 帮你分析每段对白的潜台词、优化节奏和措辞。`}
        />
      </div>
    </div>
  );
}
