import { useState } from 'react';
import type { SceneData, MediaItem } from '../types';
import { api } from '../api';
import { useStore } from '../store';
import ImageLightbox from './ImageLightbox';
import VideoGenModal from './VideoGenModal';
import ImageGenModal from './ImageGenModal';
import DubbingModal from './DubbingModal';

interface SceneCardProps {
  scene: SceneData;
  image: MediaItem | null;
  video: MediaItem | null;
  onMediaUpdated: () => void;
  onOpenVideoModal?: (sceneNum: string) => void;
  mode?: 'list' | 'grid';
}

export default function SceneCard({
  scene,
  image,
  video,
  onMediaUpdated,
  onOpenVideoModal,
  mode = 'list',
}: SceneCardProps) {
  const { currentProject, imgSettings, vidSettings, toggleSettings } = useStore();
  const [showImgModal, setShowImgModal] = useState(false);
  const [showVidModal, setShowVidModal] = useState(false);
  const [showDubModal, setShowDubModal] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [vidLoading, setVidLoading] = useState(false);
  const [imgError, setImgError] = useState('');

  const hasImgKey = imgSettings.apiKey.trim().length > 0;
  const hasVidKey = vidSettings.apiKey.trim().length > 0;

  const handleGenerateImage = async (options?: { customPrompt?: string; style?: string; aspectRatio?: string }) => {
    if (!currentProject || !hasImgKey) { toggleSettings(); return; }
    setImgLoading(true); setImgError(''); setShowImgModal(false);
    try {
      await api.generateImage(currentProject.id, scene.num, scene, options || {});
      onMediaUpdated();
    } catch (err: any) { setImgError(err.message || '生成失败'); }
    finally { setImgLoading(false); }
  };

  const handleGenerateVideo = (options: any, sceneData: any) => {
    if (!currentProject) return;
    setShowVidModal(false); setVidLoading(true);
    api.generateVideo(currentProject.id, scene.num, sceneData, options, {
      onProgress: () => {},
      onDone: () => { setVidLoading(false); onMediaUpdated(); },
      onError: (msg) => { setVidLoading(false); setImgError(msg); },
    });
  };

  return (
    <div className="glass-card-hoverable">
      <div className="flex gap-4 p-4">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] text-accent-gold/60 font-medium bg-white/[0.04] px-2 py-0.5 rounded-md">
              场景{scene.num}
            </span>
            <span className="font-serif text-[13px] text-warm-title truncate">
              {scene.beat}
            </span>
            {scene.location && (
              <span className="text-[10px] text-white/20 truncate">{scene.location}</span>
            )}
          </div>

          {/* Scene info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/25 font-mono">
            {scene.location && <span>{scene.location} {scene.time && `· ${scene.time}`}</span>}
            {scene.characters && <span>角色：{scene.characters}</span>}
          </div>
          {scene.purpose && (
            <p className="text-[11px] text-white/20 leading-relaxed">{scene.purpose}</p>
          )}

          {/* Visual Details */}
          {scene.visualDesc && (
            <div className="space-y-1">
              <p className="text-[12px] text-warm-body/60 leading-relaxed">🖼️ {scene.visualDesc}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/20">
                {scene.shotSize && <span>景别：{scene.shotSize}</span>}
                {scene.cameraMove && <span>运镜：{scene.cameraMove}</span>}
                {scene.lighting && <span>光影：{scene.lighting}</span>}
                {scene.colorTone && <span>色调：{scene.colorTone}</span>}
                {scene.style && <span>风格：{scene.style}</span>}
              </div>
            </div>
          )}

          {/* Images / Videos */}
          {(image || imgLoading || imgError) && (
            <div className="space-y-2">
              {imgLoading && (
                <div className="flex items-center gap-2 text-xs text-white/25 animate-pulse-soft">
                  <span className="w-3 h-3 border border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
                  正在生成分场配图…
                </div>
              )}
              {imgError && (
                <button onClick={() => setShowImgModal(true)} className="text-xs text-accent-red/80 hover:text-accent-red transition-colors bg-accent-red/[0.08] px-2 py-1 rounded-md border border-accent-red/20">
                  ⚠️ {imgError.length > 30 ? imgError.slice(0, 30) + '…' : imgError} — 点击重试
                </button>
              )}
              {image && (
                <div className="flex items-start gap-3">
                  <div className="relative group cursor-pointer" onClick={() => setLightbox(true)}>
                    <img
                      src={image.url}
                      alt={`场景${scene.num}`}
                      className="w-40 h-24 object-cover rounded-[8px] border border-white/[0.06] shadow-glass-sm"
                    />
                    <div className="absolute inset-0 rounded-[8px] bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <span className="text-white/0 group-hover:text-white/80 text-lg transition-all">🔍</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href={image.url} download
                      className="text-[10px] text-white/25 hover:text-accent-gold/60 transition-colors"
                    >
                      ⬇ 下载图片
                    </a>
                    <button
                      onClick={() => setShowImgModal(true)}
                      className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                    >
                      ↻ 重新生成
                    </button>
                  </div>
                </div>
              )}
              {video && (
                <div className="flex items-start gap-3">
                  <video
                    src={video.url}
                    controls
                    className="w-40 h-24 object-cover rounded-[8px] border border-white/[0.06]"
                  />
                  <a href={video.url} download className="text-[10px] text-white/25 hover:text-accent-gold/60 transition-colors">
                    ⬇ 下载视频
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 w-[72px]">
          {/* Generate Image */}
          <button
            onClick={() => { if (!hasImgKey) toggleSettings(); else setShowImgModal(true); }}
            disabled={imgLoading}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-2.5 rounded-[10px] text-[10px] leading-tight transition-all duration-200 border ${
              image
                ? 'bg-white/[0.06] text-accent-green/70 border-accent-green/15 hover:bg-white/[0.1]'
                : imgError
                ? 'bg-white/[0.04] text-accent-red/60 border-accent-red/20 hover:bg-white/[0.08]'
                : 'glass-card-hoverable text-warm-body/70'
            }`}
          >
            <span className="text-sm leading-none">{imgLoading ? '⏳' : image ? '👁️' : imgError ? '⚠️' : '🎨'}</span>
            <span>{imgLoading ? '生成中' : image ? '查看图片' : imgError ? '重试' : '生成图片'}</span>
          </button>

          {/* Generate Video */}
          <button
            onClick={() => { if (!hasVidKey) toggleSettings(); else setShowVidModal(true); }}
            disabled={vidLoading}
            className={`flex flex-col items-center justify-center gap-0.5 w-full py-2.5 rounded-[10px] text-[10px] leading-tight transition-all duration-200 border ${
              video
                ? 'bg-white/[0.06] text-accent-green/70 border-accent-green/15 hover:bg-white/[0.1]'
                : 'glass-card-hoverable text-warm-body/70'
            }`}
          >
            <span className="text-sm leading-none">{vidLoading ? '⏳' : video ? '👁️' : '🎬'}</span>
            <span>{vidLoading ? '生成中' : video ? '查看视频' : '生成视频'}</span>
          </button>

          {/* Dubbing */}
          <button
            onClick={() => setShowDubModal(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-full py-2.5 rounded-[10px] text-[10px] leading-tight transition-all duration-200 border glass-card-hoverable text-warm-body/50"
          >
            <span className="text-sm leading-none">🎵</span>
            <span>配音</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {lightbox && image && <ImageLightbox src={image.url || ''} onClose={() => setLightbox(false)} />}
      {showImgModal && currentProject && (
        <ImageGenModal
          scene={scene}
          hasImgKey={hasImgKey}
          onGenerate={handleGenerateImage}
          onClose={() => setShowImgModal(false)}
        />
      )}
      {showVidModal && currentProject && (
        <VideoGenModal
          scenes={[scene]}
          defaultSceneNum={scene.num}
          hasVidKey={hasVidKey}
          onGenerate={(options, sceneData) => handleGenerateVideo(options, sceneData)}
          onClose={() => setShowVidModal(false)}
        />
      )}
      {showDubModal && currentProject && (
        <DubbingModal
          scene={scene}
          video={video}
          hasVidKey={hasVidKey}
          onDone={() => { onMediaUpdated(); setShowDubModal(false); }}
          onClose={() => setShowDubModal(false)}
        />
      )}
    </div>
  );
}
