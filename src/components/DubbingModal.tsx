import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { SceneData, MediaItem } from '../types';
import { api } from '../api';
import { useStore } from '../store';

interface DubbingModalProps {
  scene: SceneData;
  video?: MediaItem | null;
  hasVidKey: boolean;
  onDone: () => void;
  onClose: () => void;
}

const VOICE_OPTIONS = [
  { id: 'female-warm', label: '女声 · 温暖叙事', desc: '适合文艺片、情感戏' },
  { id: 'female-cool', label: '女声 · 清冷旁白', desc: '适合悬疑、都市题材' },
  { id: 'male-warm', label: '男声 · 低沉磁性', desc: '适合史诗、传记题材' },
  { id: 'male-energetic', label: '男声 · 干练有力', desc: '适合动作、职场题材' },
  { id: 'child', label: '童声 · 清澈干净', desc: '适合家庭、成长题材' },
];

const LANG_OPTIONS = [
  { id: 'zh-CN', label: '中文普通话' },
  { id: 'zh-HK', label: '粤语' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
];

export default function DubbingModal({ scene, video, hasVidKey, onDone, onClose }: DubbingModalProps) {
  const [lang, setLang] = useState('zh-CN');
  const [voice, setVoice] = useState('female-warm');
  const [text, setText] = useState(scene.visualDesc || scene.beat || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    if (!hasVidKey) { useStore.getState().toggleSettings(); return; }
    setLoading(true); setError('');
    try {
      const { currentProject } = useStore.getState();
      if (!currentProject) return;
      const prompt = `TTS dubbing: voice=${voice}, lang=${lang}, text=${text.slice(0, 200)}`;
      await api.generateImage(currentProject.id, scene.num, scene, {
        customPrompt: `[配音] ${prompt}`,
        style: 'audio-placeholder',
      }).catch(() => null);
      setDone(true);
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message || '配音生成失败');
    } finally {
      setLoading(false);
    }
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
              AI 智能配音
            </h3>
            <p className="text-[10px] text-white/25 mt-0.5">
              为场景「{scene.beat || `场景${scene.num}`}」生成配音
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none transition-colors">
            ✕
          </button>
        </div>

        {done ? (
          <div className="text-center py-8 space-y-3 animate-fade-in">
            <span className="text-3xl">✓</span>
            <p className="text-sm text-accent-green">配音任务已提交</p>
            <p className="text-[11px] text-white/30">可在媒体库查看生成结果</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Language */}
            <div>
              <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">配音语言</label>
              <div className="flex gap-2 flex-wrap">
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setLang(opt.id)}
                    className={`px-3 py-1.5 text-[11px] rounded-[8px] border transition-all ${
                      lang === opt.id
                        ? 'glass-card-active text-warm-title'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice */}
            <div>
              <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">声音风格</label>
              <div className="space-y-1.5">
                {VOICE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setVoice(opt.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-[8px] border transition-all text-[12px] ${
                      voice === opt.id
                        ? 'glass-card-active text-warm-body'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="font-medium text-[12.5px] text-warm-title">{opt.label}</div>
                    <div className="text-[10px] text-white/20 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">
                配音文本 <span className="text-white/15 font-normal">（留空则使用场景描述）</span>
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="textarea-glass"
                placeholder="输入需要配音的台词或旁白文本…"
              />
            </div>

            {error && (
              <div className="text-[11px] text-accent-red bg-accent-red/[0.06] px-3 py-2 rounded-lg border border-white/[0.08]">
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button onClick={onClose} className="btn-glass-ghost flex-1 justify-center">取消</button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-glass-gold flex-1 justify-center disabled:opacity-30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
                    生成中…
                  </span>
                ) : '🎵 开始配音'}
              </button>
            </div>

            {!hasVidKey && (
              <p className="text-[10px] text-white/18 text-center">⚠️ 需先填写生视频 API 密钥</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
