import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { SceneData, MediaItem, VideoGenOptions } from '../types';
import SceneCard from '../components/SceneCard';
import VideoGenModal from '../components/VideoGenModal';

const SCENE_TEMPLATE = `【场景1】建立镜头 | 咖啡馆 — 日 | 主角 | 展示日常 | 清晨的阳光透过落地窗洒在木质桌面上
  画面描述：清晨的阳光透过落地窗洒在木质桌面上，主角独自坐在窗边
  景别：远景转中景
  运镜：缓推
  光影：暖色调自然光，逆光轮廓
  色调：暖黄，怀旧感
  风格：文艺写实
【场景2】激励事件 | 街道 — 夜 | 主角, 配角 | 打破平衡 | 一个意外事件改变了主角的处境
  画面描述：雨夜街道，霓虹灯倒映在积水中，主角被一个陌生人的话惊住
  景别：中景特写
  运镜：手持跟拍
  光影：冷色调霓虹光
  色调：蓝紫对比
  风格：都市悬疑`;

function parseScenes(text: string): SceneData[] {
  const lines = text.split('\n');
  const scenes: SceneData[] = [];
  let currentScene: SceneData | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('【场景')) {
      if (currentScene) scenes.push(currentScene);
      const match = trimmed.match(/【场景(\d+)】(.+?)\|(.+?)\|(.+?)\|(.+?)\|(.+)/);
      if (match) {
        currentScene = {
          num: match[1], beat: match[2].trim(), location: match[3].trim(),
          time: match[4].trim(), characters: match[5].trim(), purpose: match[6].trim(),
          description: '', lineIndex: i,
        };
      } else {
        const simpleMatch = trimmed.match(/【场景(\d+)】(.+)/);
        if (simpleMatch) {
          currentScene = {
            num: simpleMatch[1], beat: simpleMatch[2].split('|')[0]?.trim() || '',
            location: '', time: '', characters: '', purpose: '',
            description: '', lineIndex: i,
          };
        }
      }
    } else if (currentScene && (trimmed.startsWith('画面描述') || trimmed.startsWith('画面：'))) {
      currentScene.visualDesc = trimmed.replace(/^(画面描述|画面)[：:]\s*/, '');
    } else if (currentScene && (trimmed.startsWith('景别') || trimmed.startsWith('景别：'))) {
      currentScene.shotSize = trimmed.replace(/^(景别)[：:]\s*/, '');
    } else if (currentScene && (trimmed.startsWith('运镜') || trimmed.startsWith('镜头'))) {
      currentScene.cameraMove = trimmed.replace(/^(运镜|镜头)[：:]\s*/, '');
    } else if (currentScene && trimmed.startsWith('光影')) {
      currentScene.lighting = trimmed.replace(/^光影[：:]\s*/, '');
    } else if (currentScene && trimmed.startsWith('色调')) {
      currentScene.colorTone = trimmed.replace(/^色调[：:]\s*/, '');
    } else if (currentScene && trimmed.startsWith('风格')) {
      currentScene.style = trimmed.replace(/^风格[：:]\s*/, '');
    }
  }
  if (currentScene) scenes.push(currentScene);
  return scenes;
}

export default function OutlineModule() {
  const {
    currentProject, moduleContents, saveContent,
    projectMedia, loadMedia, imgSettings, vidSettings, toggleSettings,
  } = useStore();
  const content = moduleContents.outline || '';
  const [batchProgress, setBatchProgress] = useState('');
  const [batchError, setBatchError] = useState('');
  const [batchPrompt, setBatchPrompt] = useState('');
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [videoModalScene, setVideoModalScene] = useState<string | null>(null);
  const [showBatchVideoModal, setShowBatchVideoModal] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const scenes = useMemo(() => parseScenes(content), [content]);

  const imageMap = useMemo(() => {
    const map: Record<string, MediaItem> = {};
    for (const m of projectMedia) {
      if (m.type === 'image' && (!map[m.scene_num] || m.created_at > map[m.scene_num].created_at))
        map[m.scene_num] = { ...m, url: `/api/media-files/${m.file_path}` };
    }
    return map;
  }, [projectMedia]);

  const videoMap = useMemo(() => {
    const map: Record<string, MediaItem> = {};
    for (const m of projectMedia) {
      if (m.type === 'video' && (!map[m.scene_num] || m.created_at > map[m.scene_num].created_at))
        map[m.scene_num] = { ...m, url: `/api/media-files/${m.file_path}` };
    }
    return map;
  }, [projectMedia]);

  const hasImgKey = imgSettings.apiKey.trim().length > 0;
  const hasVidKey = vidSettings.apiKey.trim().length > 0;

  useEffect(() => { if (projectMedia.length > 0) setShowGuide(false); }, [projectMedia]);

  const handleBatchGenerate = async () => {
    if (!currentProject || !hasImgKey) { toggleSettings(); return; }
    if (scenes.length === 0) return;
    setBatchError(''); setShowBatchPanel(false);
    let success = 0, failed = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      setBatchProgress(`正在生成 ${i + 1}/${scenes.length}：场景${scene.num}...`);
      try { await api.generateImage(currentProject.id, scene.num, scene, { customPrompt: batchPrompt.trim(), style: '', aspectRatio: '16:9' }); success++; }
      catch (err: any) { failed++; setBatchError(`场景${scene.num} 失败: ${err.message}`); }
    }
    setBatchProgress(''); await loadMedia(currentProject.id);
    setBatchProgress(failed === 0 ? `✓ 全部完成！成功 ${success} 张` : `完成：成功 ${success}，失败 ${failed}`);
    setTimeout(() => setBatchProgress(''), 4000);
  };

  const handleBatchVideoGenerate = (options: VideoGenOptions, sceneData: Partial<SceneData>) => {
    if (!currentProject) return;
    setShowBatchVideoModal(false);
    const sceneNums = options.sceneNums;
    if (sceneNums.length === 0) return;
    const generateAll = async () => {
      setBatchProgress('正在批量生成视频...');
      let success = 0, failed = 0;
      for (let i = 0; i < sceneNums.length; i++) {
        const num = sceneNums[i];
        setBatchProgress(`视频 ${i + 1}/${sceneNums.length}：场景${num}...`);
        try {
          await new Promise<void>((resolve, reject) => {
            api.generateVideo(currentProject.id, num, sceneData, { ...options, sceneNums: [num], mode: 'single' },
              { onProgress: () => {}, onDone: () => resolve(), onError: (msg) => reject(new Error(msg)) });
          }); success++;
        } catch (err: any) { failed++; setBatchError(`场景${num} 失败: ${err.message}`); }
      }
      setBatchProgress('');
      await loadMedia(currentProject.id);
      setBatchProgress(failed === 0 ? `✓ 全部完成！成功 ${success} 个` : `完成：成功 ${success}，失败 ${failed}`);
      setTimeout(() => setBatchProgress(''), 4000);
    };
    generateAll();
  };

  const ToolbarButton = ({ icon, title, subtitle, onClick, disabled }: {
    icon: string; title: string; subtitle: string; onClick: () => void; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="glass-card-hoverable p-4 text-left group flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
        <div>
          <div className="text-[13px] font-medium text-warm-title leading-snug">{title}</div>
          <div className="text-[10px] text-white/25 mt-1 leading-tight">{subtitle}</div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 🎬 Smart Toolbar */}
      {scenes.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg opacity-70">🎬</span>
            <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">
              智能创作工具栏
            </h3>
            <span className="text-[10px] text-accent-gold/40 bg-white/[0.04] px-2 py-0.5 rounded-full font-medium">
              {scenes.length} 个场景
            </span>
          </div>
          <div className="flex gap-3">
            <ToolbarButton
              icon="📸" title="一键生成全部分场配图" subtitle="批量生成分场概念图"
              onClick={() => { if (!hasImgKey) toggleSettings(); else setShowBatchPanel(true); }}
            />
            <ToolbarButton
              icon="🎥" title="一键生成完整视频片段" subtitle="所有分场连贯生成视频"
              onClick={() => { if (!hasVidKey) toggleSettings(); else setShowBatchVideoModal(true); }}
            />
            <ToolbarButton
              icon="🎵" title="一键匹配全片配乐" subtitle="AI 推荐影片背景音乐"
              onClick={() => {}}
            />
          </div>
        </div>
      )}

      {/* Batch Image Panel */}
      {showBatchPanel && scenes.length > 0 && (
        <div className="glass-card p-5 space-y-4 animate-fade-in-down">
          <div className="flex items-center gap-3">
            <span className="text-lg opacity-70">📸</span>
            <div>
              <h4 className="text-sm font-medium text-warm-title">批量生成分场配图</h4>
              <p className="text-[10px] text-white/25 mt-0.5">
                输入统一构图要求应用到所有分镜。留空则使用场景自动信息。
              </p>
            </div>
          </div>
          <textarea
            value={batchPrompt} onChange={(e) => setBatchPrompt(e.target.value)}
            rows={3}
            className="textarea-glass"
            placeholder="示例：电影感画面，暖色调，胶片质感，浅景深，专业摄影构图"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/20">将为 {scenes.length} 个场景逐一生成（16:9）</p>
            <div className="flex gap-2">
              <button onClick={() => setShowBatchPanel(false)} className="btn-glass-ghost">取消</button>
              <button onClick={handleBatchGenerate} className="btn-glass-gold">确认生成全部</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Error */}
      {batchProgress && (
        <div className={`glass-card py-3 px-5 text-xs flex items-center gap-2.5 animate-fade-in ${
          batchProgress.startsWith('✓') ? 'border-accent-green/30' : ''
        }`}>
          {!batchProgress.startsWith('✓') && (
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/10 border-t-accent-gold/60 rounded-full animate-spin" />
          )}
          <span className={batchProgress.startsWith('✓') ? 'text-accent-green' : 'text-warm-body'}>
            {batchProgress}
          </span>
        </div>
      )}
      {batchError && (
        <div className="glass-card py-3 px-5 text-xs text-accent-red/80 animate-fade-in border-accent-red/20">
          ⚠️ {batchError}
        </div>
      )}

      {/* Scene Cards */}
      {scenes.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">分镜列表</h3>
            <span className="text-[10px] text-white/20">{scenes.length} 个场景</span>
          </div>
          <div className="space-y-3">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.num + '_' + scene.lineIndex}
                scene={scene}
                image={imageMap[scene.num] || null}
                video={videoMap[scene.num] || null}
                onMediaUpdated={() => currentProject && loadMedia(currentProject.id)}
                onOpenVideoModal={(num) => setVideoModalScene(num)}
                mode="list"
              />
            ))}
          </div>

          {/* Guide Hint */}
          {showGuide && (
            <div className="glass-card py-4 px-5 flex items-start gap-3 text-xs animate-fade-in">
              <span className="text-base opacity-60">💡</span>
              <div>
                <p className="font-medium text-warm-title/70 mb-1">提示</p>
                <p className="text-white/30 leading-relaxed">
                  点击分场右侧的「生成图片」「生成视频」按钮，AI 生成对应画面和动态视频。
                  请在设置中填写生图/生视频 API 密钥。
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Editor */}
      <div className="glass-card overflow-hidden">
        <div className="px-7 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">分场大纲编辑器</h3>
            <p className="text-[10px] text-white/20 mt-0.5 leading-relaxed">
              格式：【场景N】节拍 | 地点 | 时间 | 角色 | 场景目的<br />
              缩进行：画面描述 / 景别 / 运镜 / 光影 / 色调 / 风格
            </p>
          </div>
          <button
            onClick={() => saveContent(content ? `${content}\n${SCENE_TEMPLATE}` : SCENE_TEMPLATE)}
            className="btn-glass-ghost"
          >
            + 插入模板
          </button>
        </div>
        <textarea
          value={content} onChange={(e) => saveContent(e.target.value)}
          className="w-full h-[400px] bg-transparent outline-none resize-none font-mono text-[13px] text-warm-body/70 leading-relaxed px-7 py-6 placeholder:text-white/12"
          placeholder={`在这里编写你的分场大纲。

格式：
【场景编号】节拍类型 | 地点 — 时间 | 出场角色 | 场景目的 | 一句话描述
  画面描述：详细描述这个场景的画面
  景别：远景/中景/近景/特写
  运镜：推/拉/摇/移/跟
  光影：光线方向、强度、色温
  色调：整体色彩倾向
  风格：写实/动画/文艺/黑色电影

添加视觉细节后，可在上方分镜卡片中生成 AI 图片和视频。`}
        />
      </div>

      {/* Video Modals */}
      {videoModalScene && currentProject && (
        <VideoGenModal
          scenes={scenes} defaultSceneNum={videoModalScene} hasVidKey={hasVidKey}
          onGenerate={(options, sceneData) => {
            const scene = scenes.find(s => s.num === videoModalScene);
            if (!scene) return;
            setVideoModalScene(null);
            api.generateVideo(currentProject.id, scene.num, sceneData, options, {
              onProgress: () => {}, onDone: () => loadMedia(currentProject.id), onError: () => {},
            });
          }}
          onClose={() => setVideoModalScene(null)}
        />
      )}
      {showBatchVideoModal && currentProject && (
        <VideoGenModal
          scenes={scenes} defaultSceneNum="" hasVidKey={hasVidKey}
          onGenerate={handleBatchVideoGenerate}
          onClose={() => setShowBatchVideoModal(false)}
        />
      )}
    </div>
  );
}
