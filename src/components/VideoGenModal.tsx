import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { SceneData, VideoMode, VideoGenOptions } from '../types';
import { IMETextarea } from '../components/IMEInput';

interface VideoGenModalProps {
  scenes: SceneData[];
  defaultSceneNum: string;
  hasVidKey: boolean;
  onGenerate: (options: VideoGenOptions, sceneData: Partial<SceneData>) => void;
  onClose: () => void;
}

export default function VideoGenModal({
  scenes, defaultSceneNum, hasVidKey, onGenerate, onClose,
}: VideoGenModalProps) {
  const [mode, setMode] = useState<VideoMode>(defaultSceneNum ? 'single' : 'multi');
  const [selectedScenes, setSelectedScenes] = useState<string[]>(defaultSceneNum ? [defaultSceneNum] : []);
  const [duration, setDuration] = useState(5);
  const [cameraMove, setCameraMove] = useState('');
  const [style, setStyle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const toggleScene = (num: string) => {
    setSelectedScenes(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleGenerate = () => {
    if (!hasVidKey) return;
    const options: VideoGenOptions = {
      mode, sceneNums: selectedScenes, duration,
      cameraMovement: cameraMove, style, customPrompt: customPrompt.trim(),
    };
    const sceneData: Partial<SceneData> = scenes[0] || {};
    onGenerate(options, sceneData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 glass-overlay" />
      <div
        className="glass-modal w-full max-w-lg p-6 space-y-5 animate-fade-in-up max-h-[90vh] overflow-y-auto relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">生成视频</h3>
            <p className="text-[10px] text-white/25 mt-0.5">
              {mode === 'single' ? '单图动效' : '多镜连贯'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">
            ✕
          </button>
        </div>

        {/* Mode Switch */}
        <div className="flex bg-white/[0.04] rounded-[10px] p-0.5">
          {(['single', 'multi'] as VideoMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs rounded-[8px] transition-all ${
                mode === m ? 'glass-card-active text-warm-title' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {m === 'single' ? '单图动效' : '多镜连贯'}
            </button>
          ))}
        </div>

        {/* Scene Selection */}
        {mode === 'multi' && (
          <div>
            <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">选择场景</label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {scenes.map(s => (
                <label
                  key={s.num}
                  className={`flex items-center gap-2.5 p-2.5 rounded-[8px] cursor-pointer transition-all text-xs border ${
                    selectedScenes.includes(s.num)
                      ? 'glass-card-active'
                      : 'bg-white/[0.03] border-transparent hover:bg-white/[0.06] text-white/35'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedScenes.includes(s.num)}
                    onChange={() => toggleScene(s.num)}
                    className="sr-only"
                  />
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    selectedScenes.includes(s.num) ? 'bg-accent-gold/30 border-accent-gold/50' : 'border-white/15'
                  }`}>
                    {selectedScenes.includes(s.num) && <span className="text-[8px] text-warm-title">✓</span>}
                  </span>
                  <span>场景{s.num}</span>
                  <span className="text-white/15 truncate flex-1">{s.beat}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom prompt */}
        <div>
          <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">
            自定义视频要求（可选）
          </label>
          <IMETextarea
            value={customPrompt}
            onValueChange={(v) => setCustomPrompt(v)}
            rows={2}
            className="textarea-glass"
            placeholder="描述你想要的视频效果，如：缓慢推进，柔光氛围，胶片质感…"
          />
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">时长（秒）</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input-glass">
                {[3, 5, 7, 10, 15].map(d => <option key={d} value={d}>{d} 秒</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">画面风格</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-glass">
                <option value="">自动</option>
                <option value="cinematic">电影感</option>
                <option value="vintage">复古胶片</option>
                <option value="noir">黑色电影</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">运镜方式</label>
            <div className="flex flex-wrap gap-1.5">
              {['推镜', '拉镜', '摇镜', '移镜', '跟拍', '升镜', '降镜', '固定'].map(m => (
                <button
                  key={m}
                  onClick={() => setCameraMove(cameraMove === m ? '' : m)}
                  className={`px-3 py-1.5 text-[11px] rounded-[8px] border transition-all ${
                    cameraMove === m
                      ? 'glass-card-active'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:bg-white/[0.06]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onClose} className="btn-glass-ghost flex-1 justify-center">取消</button>
          <button
            onClick={handleGenerate}
            disabled={selectedScenes.length === 0}
            className="btn-glass-gold flex-1 justify-center disabled:opacity-30"
          >
            🎬 生成视频
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
