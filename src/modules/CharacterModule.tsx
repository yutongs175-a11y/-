import { useStore } from '../store';
import { IMETextarea } from '../components/IMEInput';

interface CharacterCard {
  name: string;
  role: string;
  age: string;
  desire: string;
  fear: string;
  mask: string;
  truth: string;
  arc_start: string;
  arc_end: string;
  voice: string;
}

const EMPTY_CHARACTER: CharacterCard = {
  name: '', role: '主角', age: '', desire: '', fear: '',
  mask: '', truth: '', arc_start: '', arc_end: '', voice: '',
};

export default function CharacterModule() {
  const { moduleContents, saveContent } = useStore();
  const content = moduleContents.character || '';

  const parseCharacters = (text: string): CharacterCard[] => {
    if (!text.trim()) return [];
    const blocks = text.split(/\n════════\n/).filter(Boolean);
    return blocks.map((block) => {
      const card: any = { ...EMPTY_CHARACTER };
      for (const line of block.split('\n')) {
        const match = line.match(/^【(.+?)】(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          const fieldMap: Record<string, keyof CharacterCard> = {
            '姓名': 'name', '定位': 'role', '年龄': 'age',
            '核心欲望': 'desire', '核心恐惧': 'fear',
            '外在面具': 'mask', '内在真相': 'truth',
            '弧光起点': 'arc_start', '弧光终点': 'arc_end',
            '语言风格': 'voice',
          };
          if (fieldMap[key]) card[fieldMap[key]] = value;
        }
      }
      return card as CharacterCard;
    });
  };

  const characters = parseCharacters(content);

  const addCharacter = () => {
    const newChar = { ...EMPTY_CHARACTER, name: `角色${characters.length + 1}` };
    const charText = formatCharacter(newChar);
    saveContent(content ? `${content}\n════════\n${charText}` : charText);
  };

  const formatCharacter = (c: CharacterCard): string => {
    return [
      `【姓名】${c.name}`, `【定位】${c.role}`, `【年龄】${c.age}`,
      `【核心欲望】${c.desire}`, `【核心恐惧】${c.fear}`,
      `【外在面具】${c.mask}`, `【内在真相】${c.truth}`,
      `【弧光起点】${c.arc_start}`, `【弧光终点】${c.arc_end}`,
      `【语言风格】${c.voice}`,
    ].join('\n');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Character Cards Grid */}
      {characters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char, idx) => (
            <div key={idx} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div>
                  <h4 className="font-serif text-sm font-normal text-warm-title">
                    {char.name || '未命名'}
                  </h4>
                  <span className="text-[11px] text-white/25">{char.role}</span>
                </div>
                <span className="text-xl opacity-50">
                  {char.role.includes('反') ? '🗡️' : char.role.includes('配') ? '🎭' : '⭐'}
                </span>
              </div>
              <div className="space-y-2.5">
                {char.desire && <Field label="欲望" value={char.desire} color="text-accent-red/80" />}
                {char.fear && <Field label="恐惧" value={char.fear} color="text-warm-body/60" />}
                {char.mask && <Field label="面具" value={char.mask} color="text-warm-body/60" />}
                {char.truth && <Field label="真相" value={char.truth} color="text-warm-body/70" />}
                {char.voice && <Field label="声音" value={char.voice} color="text-white/35" />}
              </div>
              {char.arc_start && char.arc_end && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[10px] text-white/25">
                    <span className="flex-1 truncate">{char.arc_start}</span>
                    <span className="text-accent-gold/60">→</span>
                    <span className="flex-1 truncate text-right">{char.arc_end}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raw Editor */}
      <div className="glass-card overflow-hidden">
        <div className="px-7 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">角色档案编辑器</h3>
          <button onClick={addCharacter} className="btn-glass-ghost">
            + 添加角色模板
          </button>
        </div>
        <IMETextarea
          value={content}
          onValueChange={(v) => saveContent(v)}
          className="w-full h-[400px] bg-transparent outline-none resize-none font-mono text-[13px] text-warm-body/70 leading-relaxed px-7 py-6 placeholder:text-white/12"
          placeholder={`在这里创建你的角色。点击"添加角色模板"生成标准格式，或让右侧 AI 帮你构建。

每个角色包含：
· 核心欲望 — 驱动角色行动的内在动力
· 核心恐惧 — 角色不愿面对的深层恐惧
· 外在面具 vs 内在真相 — 角色的反差张力
· 弧光起点 → 终点 — 角色的变化轨迹
· 语言风格 — 独特的说话方式`}
        />
      </div>
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex gap-2.5 text-[12px]">
      <span className="text-white/20 flex-shrink-0 w-10 font-medium">{label}</span>
      <span className={`${color} flex-1 leading-relaxed`}>{value}</span>
    </div>
  );
}
