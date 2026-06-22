import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { SceneData } from '../types';
import { IMETextarea } from '../components/IMEInput';

interface ImageGenModalProps {
  scene: SceneData;
  hasImgKey: boolean;
  onGenerate: (options: { customPrompt?: string; style?: string; aspectRatio?: string }) => void;
  onClose: () => void;
}

export default function ImageGenModal({ scene, hasImgKey, onGenerate, onClose }: ImageGenModalProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Build auto-suggested prompt from scene data
  const autoPrompt = [
    scene.visualDesc || scene.description,
    scene.shotSize ? `Shot: ${scene.shotSize}` : '',
    scene.cameraMove ? `Camera: ${scene.cameraMove}` : '',
    scene.lighting ? `Lighting: ${scene.lighting}` : '',
    scene.colorTone ? `Color: ${scene.colorTone}` : '',
    scene.style ? `Style: ${scene.style}` : '',
    'cinematic film still, professional cinematography, high detail',
  ].filter(Boolean).join(', ');

  const handleGenerate = () => {
    if (!hasImgKey) return;
    onGenerate({ customPrompt: customPrompt.trim(), style, aspectRatio });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 glass-overlay" />
      <div
        className="glass-modal w-full max-w-lg p-6 space-y-5 animate-fade-in-up relative z-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">
              生成分场配图
            </h3>
            <p className="text-[10px] text-white/25 mt-0.5">
              场景{scene.num} · {scene.beat || '未命名'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">
            ✕
          </button>
        </div>

        {/* Auto prompt preview */}
        <div>
          <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">
            自动生成提示词
          </label>
          <div className="glass-card-subtle p-3 text-xs text-white/35 leading-relaxed max-h-20 overflow-y-auto">
            {autoPrompt || '（无视觉描述数据）'}
          </div>
        </div>

        {/* Custom prompt */}
        <div>
          <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">
            自定义构图要求（可选）
          </label>
          <IMETextarea
            value={customPrompt}
            onValueChange={(v) => setCustomPrompt(v)}
            rows={3}
            className="textarea-glass"
            placeholder="补充你的构图和美术设计要求，将追加到自动提示词之后…"
          />
        </div>

        {/* Style & Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">画面风格</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="input-glass"
            >
              <option value="cinematic">电影感</option>
              <option value="realistic">写实</option>
              <option value="artistic">文艺</option>
              <option value="noir">黑色电影</option>
              <option value="anime">动画风格</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">宽高比</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="input-glass"
            >
              <option value="16:9">16:9 宽屏</option>
              <option value="2.39:1">2.39:1 电影宽幅</option>
              <option value="1:1">1:1 方形</option>
              <option value="4:3">4:3 经典</option>
              <option value="9:16">9:16 竖屏</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onClose} className="btn-glass-ghost flex-1 justify-center">取消</button>
          <button onClick={handleGenerate} className="btn-glass-gold flex-1 justify-center">
            🎨 生成图片
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
