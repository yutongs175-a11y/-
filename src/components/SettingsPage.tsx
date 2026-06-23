import { useStore } from '../store';
import { useState, useRef } from 'react';
import type { AIProvider, ImageProvider, VideoProvider } from '../types';

const AI_PROVIDERS: { key: AIProvider; label: string; description: string }[] = [
  { key: 'deepseek', label: 'DeepSeek', description: '高性价比，中文理解出色' },
  { key: 'doubao', label: '豆包 (字节跳动)', description: '火山引擎，支持多模态' },
  { key: 'tongyi', label: '通义千问 (阿里)', description: '阿里云大模型，中文能力强' },
  { key: 'custom', label: '自定义', description: '兼容 OpenAI 格式的 API' },
];

const IMG_PROVIDERS: { key: ImageProvider; label: string; description: string }[] = [
  { key: 'jimeng', label: '即梦 AI', description: '字节跳动 AI 生图，火山引擎 Ark' },
  { key: 'sd', label: 'Stable Diffusion', description: 'Stability AI，开源生图模型' },
  { key: 'custom', label: '自定义 API', description: '兼容 OpenAI 生图格式的中转平台' },
];

const VID_PROVIDERS: { key: VideoProvider; label: string; description: string }[] = [
  { key: 'jimeng', label: '即梦 AI', description: 'AI 视频生成，任务提交+轮询' },
  { key: 'runway', label: 'Runway', description: 'Gen-3 Alpha，电影级视频生成' },
  { key: 'pika', label: 'Pika', description: 'Pika 2.0，快速视频生成' },
  { key: 'custom', label: '自定义 API', description: '兼容主流视频生成 API 格式' },
];

const AI_DEFAULTS: Record<string, { baseURL: string; model: string }> = {
  deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  doubao: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-1.5-pro-32k' },
  tongyi: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  custom: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
};

const IMG_DEFAULTS: Record<string, { baseURL: string; model: string }> = {
  jimeng: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedream-4-0-250828' },
  sd: { baseURL: 'https://api.stability.ai/v2beta/stable-image/generate', model: 'sd3.5-large' },
  custom: { baseURL: 'https://api.openai.com/v1', model: 'dall-e-3' },
};

const VID_DEFAULTS: Record<string, { baseURL: string; model: string }> = {
  jimeng: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedance-1-0-pro-t2v-250528' },
  runway: { baseURL: 'https://api.runwayml.com/v1', model: 'gen3a_turbo' },
  pika: { baseURL: 'https://api.pika.art/v2', model: 'pika-2.0' },
  custom: { baseURL: 'https://api.runwayml.com/v1', model: 'custom-video-model' },
};

type SettingTab = 'ai' | 'image' | 'video';

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const { aiSettings, imgSettings, vidSettings, updateAISettings, updateImgSettings, updateVidSettings, customBackground, setCustomBackground, clearCustomBackground } = useStore();
  const [tab, setTab] = useState<SettingTab>('ai');

  const tabs = [
    { key: 'ai' as const, label: '文本大模型', icon: '🤖' },
    { key: 'image' as const, label: 'AI 生图', icon: '🎨' },
    { key: 'video' as const, label: 'AI 生视频', icon: '🎬' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 glass-overlay" />
      <div
        className="glass-modal w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-in-up relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-serif text-lg font-normal text-warm-title tracking-[0.04em]">
            AI 设置
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3.5 text-xs font-medium transition-all border-b-2 ${
                tab === t.key
                  ? 'border-accent-gold/40 text-warm-title'
                  : 'border-transparent text-white/25 hover:text-white/45'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-7">
          {tab === 'ai' && (
            <AITab settings={aiSettings} update={updateAISettings} />
          )}
          {tab === 'image' && (
            <ImageTab settings={imgSettings} update={updateImgSettings} aiSettings={aiSettings} />
          )}
          {tab === 'video' && (
            <VideoTab settings={vidSettings} update={updateVidSettings} aiSettings={aiSettings} />
          )}
        </div>

        {/* Custom Background */}
        <div className="px-7 pb-7">
          <div className="border-t border-white/[0.06] pt-5">
            <BackgroundSection
              customBackground={customBackground}
              setCustomBackground={setCustomBackground}
              clearCustomBackground={clearCustomBackground}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AI Text Tab
   ============================================================ */
function AITab({
  settings, update,
}: {
  settings: { provider: AIProvider; apiKey: string; baseURL: string; model: string };
  update: (s: typeof settings) => void;
}) {
  const handleProvider = (p: AIProvider) => {
    const defaults = AI_DEFAULTS[p];
    update({ ...settings, provider: p, baseURL: defaults.baseURL, model: defaults.model });
  };

  return (
    <div className="space-y-5">
      <Section label="选择大模型平台">
        <div className="space-y-1.5">
          {AI_PROVIDERS.map(p => (
            <label key={p.key} className={`flex items-center gap-3 p-3.5 rounded-[10px] cursor-pointer transition-all border ${
              settings.provider === p.key ? 'glass-card-active' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'
            }`}>
              <input type="radio" name="ai-provider" checked={settings.provider === p.key} onChange={() => handleProvider(p.key)} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                settings.provider === p.key ? 'border-accent-gold/50' : 'border-white/15'
              }`}>
                {settings.provider === p.key && <span className="w-2 h-2 rounded-full bg-accent-gold/60" />}
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-warm-title">{p.label}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{p.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      <Section label="API 密钥">
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => update({ ...settings, apiKey: e.target.value })}
          className="input-glass"
          placeholder="sk-xxxxxxxxxxxxxxxx"
        />
        <p className="text-[10px] text-white/20 mt-1.5">密钥仅保存在你的浏览器本地，不经过服务器</p>
      </Section>

      <Section label="API 地址">
        <input
          type="text"
          value={settings.baseURL}
          onChange={(e) => update({ ...settings, baseURL: e.target.value })}
          className="input-glass"
          placeholder="https://api.example.com/v1"
        />
      </Section>

      <Section label="模型名称">
        <input
          type="text"
          value={settings.model}
          onChange={(e) => update({ ...settings, model: e.target.value })}
          className="input-glass"
          placeholder="model-name"
        />
      </Section>
    </div>
  );
}

/* ============================================================
   Image Tab
   ============================================================ */
function ImageTab({
  settings, update, aiSettings,
}: {
  settings: { provider: ImageProvider; apiKey: string; baseURL: string; model: string };
  update: (s: typeof settings) => void;
  aiSettings: { provider: AIProvider; apiKey: string; baseURL: string; model: string };
}) {
  const handleProvider = (p: ImageProvider) => {
    const defaults = IMG_DEFAULTS[p];
    update({ ...settings, provider: p, baseURL: defaults.baseURL, model: defaults.model });
  };

  // Check if text AI also uses 火山引擎 Ark (豆包) — same key can be shared
  const canSyncFromAI = aiSettings.provider === 'doubao' && settings.provider === 'jimeng';
  const sameKey = settings.apiKey === aiSettings.apiKey && settings.apiKey.length > 0;

  return (
    <div className="space-y-5">
      <Section label="选择生图平台">
        <div className="space-y-1.5">
          {IMG_PROVIDERS.map(p => (
            <label key={p.key} className={`flex items-center gap-3 p-3.5 rounded-[10px] cursor-pointer transition-all border ${
              settings.provider === p.key ? 'glass-card-active' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'
            }`}>
              <input type="radio" name="img-provider" checked={settings.provider === p.key} onChange={() => handleProvider(p.key)} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                settings.provider === p.key ? 'border-accent-gold/50' : 'border-white/15'
              }`}>
                {settings.provider === p.key && <span className="w-2 h-2 rounded-full bg-accent-gold/60" />}
              </span>
              <div>
                <div className="text-[13px] font-medium text-warm-title">{p.label}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{p.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Sync key hint for 豆包 + 即梦 */}
      {canSyncFromAI && !sameKey && aiSettings.apiKey.length > 0 && (
        <div className="bg-accent-gold/[0.06] border border-accent-gold/[0.12] rounded-[10px] p-3.5">
          <p className="text-[10px] text-white/30 mb-2">
            💡 豆包和即梦共用火山引擎 Ark 密钥，可以一键同步
          </p>
          <button
            onClick={() => update({ ...settings, apiKey: aiSettings.apiKey })}
            className="btn-glass-gold py-1.5 px-3 text-[11px]"
          >
            📋 从文本大模型同步密钥
          </button>
        </div>
      )}
      {sameKey && (
        <div className="bg-accent-green/[0.06] border border-accent-green/[0.12] rounded-[10px] p-3 flex items-center gap-2 text-[10px] text-accent-green/70">
          ✓ 已与文本大模型密钥同步
        </div>
      )}

      <Section label="API 密钥（Ark 网关）">
        <input type="password" value={settings.apiKey} onChange={(e) => update({ ...settings, apiKey: e.target.value })} className="input-glass" placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        <div className="mt-1.5 space-y-1">
          <p className="text-[10px] text-white/20">
            即梦 AI 生图使用火山引擎 Ark 网关，密钥格式为 <code className="text-white/35 bg-white/[0.05] px-1 rounded">sk-</code> 开头
          </p>
          <p className="text-[10px] text-white/20">
            获取方式：登录火山引擎控制台 → 方舟 → API Key 管理 → 创建密钥
          </p>
          <a
            href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[10px] text-accent-gold/50 hover:text-accent-gold/70 transition-colors"
          >
            前往火山引擎获取密钥 →
          </a>
        </div>
      </Section>

      <Section label="API 地址">
        <input type="text" value={settings.baseURL} onChange={(e) => update({ ...settings, baseURL: e.target.value })} className="input-glass" />
      </Section>

      <Section label="模型名称">
        <input type="text" value={settings.model} onChange={(e) => update({ ...settings, model: e.target.value })} className="input-glass" />
      </Section>
    </div>
  );
}

/* ============================================================
   Video Tab
   ============================================================ */
function VideoTab({
  settings, update, aiSettings,
}: {
  settings: { provider: VideoProvider; apiKey: string; baseURL: string; model: string };
  update: (s: typeof settings) => void;
  aiSettings: { provider: AIProvider; apiKey: string; baseURL: string; model: string };
}) {
  const handleProvider = (p: VideoProvider) => {
    const defaults = VID_DEFAULTS[p];
    update({ ...settings, provider: p, baseURL: defaults.baseURL, model: defaults.model });
  };

  const canSyncFromAI = aiSettings.provider === 'doubao' && settings.provider === 'jimeng';
  const sameKey = settings.apiKey === aiSettings.apiKey && settings.apiKey.length > 0;

  return (
    <div className="space-y-5">
      <Section label="选择生视频平台">
        <div className="space-y-1.5">
          {VID_PROVIDERS.map(p => (
            <label key={p.key} className={`flex items-center gap-3 p-3.5 rounded-[10px] cursor-pointer transition-all border ${
              settings.provider === p.key ? 'glass-card-active' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'
            }`}>
              <input type="radio" name="vid-provider" checked={settings.provider === p.key} onChange={() => handleProvider(p.key)} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                settings.provider === p.key ? 'border-accent-gold/50' : 'border-white/15'
              }`}>
                {settings.provider === p.key && <span className="w-2 h-2 rounded-full bg-accent-gold/60" />}
              </span>
              <div>
                <div className="text-[13px] font-medium text-warm-title">{p.label}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{p.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Sync key hint */}
      {canSyncFromAI && !sameKey && aiSettings.apiKey.length > 0 && (
        <div className="bg-accent-gold/[0.06] border border-accent-gold/[0.12] rounded-[10px] p-3.5">
          <p className="text-[10px] text-white/30 mb-2">
            💡 豆包和即梦共用火山引擎 Ark 密钥，可以一键同步
          </p>
          <button
            onClick={() => update({ ...settings, apiKey: aiSettings.apiKey })}
            className="btn-glass-gold py-1.5 px-3 text-[11px]"
          >
            📋 从文本大模型同步密钥
          </button>
        </div>
      )}
      {sameKey && (
        <div className="bg-accent-green/[0.06] border border-accent-green/[0.12] rounded-[10px] p-3 flex items-center gap-2 text-[10px] text-accent-green/70">
          ✓ 已与文本大模型密钥同步
        </div>
      )}

      <Section label={settings.provider === 'jimeng' ? 'API 密钥（即梦 AI）' : 'API 密钥'}>
        <input type="password" value={settings.apiKey} onChange={(e) => update({ ...settings, apiKey: e.target.value })} className="input-glass" placeholder={settings.provider === 'jimeng' ? 'sk-xxxxxxxxxxxxxxxx' : 'API Key'} />
        <div className="mt-1.5 space-y-1">
          {settings.provider === 'jimeng' ? (
            <>
              <p className="text-[10px] text-white/20">
                即梦 AI 生视频使用火山引擎即梦独立 API，密钥格式为 <code className="text-white/35 bg-white/[0.05] px-1 rounded">sk-</code> 开头（与即梦生图共用同一 Ark API Key）
              </p>
              <a
                href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[10px] text-accent-gold/50 hover:text-accent-gold/70 transition-colors"
              >
                前往火山引擎获取密钥 →
              </a>
            </>
          ) : (
            <p className="text-[10px] text-white/20">密钥仅保存在你的浏览器本地，不经过服务器</p>
          )}
        </div>
      </Section>

      <Section label="API 地址">
        <input type="text" value={settings.baseURL} onChange={(e) => update({ ...settings, baseURL: e.target.value })} className="input-glass" />
      </Section>

      <Section label="模型名称">
        <input type="text" value={settings.model} onChange={(e) => update({ ...settings, model: e.target.value })} className="input-glass" />
      </Section>
    </div>
  );
}

/* Helper: section wrapper */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-white/25 mb-2 font-medium tracking-[0.03em]">{label}</label>
      {children}
    </div>
  );
}

/* ============================================================
   Custom Background Section
   ============================================================ */
function BackgroundSection({
  customBackground,
  setCustomBackground,
  clearCustomBackground,
}: {
  customBackground: string | null;
  setCustomBackground: (dataUrl: string) => void;
  clearCustomBackground: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(customBackground);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件 (JPG/PNG/WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件不能超过 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      setCustomBackground(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setPreview(null);
    clearCustomBackground();
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-serif text-sm font-normal text-warm-title tracking-[0.04em]">🖼️ 自定义背景</h4>
        <p className="text-[10px] text-white/25 mt-1">
          上传本地图片作为应用底图，自动进行暗化、胶片颗粒和暗角处理
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08] aspect-video">
          <img
            src={preview}
            alt="背景预览"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4) saturate(0.6)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white/50">
            当前自定义背景（预览效果）
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-glass flex-1 justify-center"
        >
          📷 {preview ? '更换背景图' : '上传背景图'}
        </button>
        {preview && (
          <button
            onClick={handleReset}
            className="btn-glass-ghost justify-center"
          >
            恢复默认背景
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p className="text-[10px] text-white/15">
        支持 JPG / PNG / WebP 格式，最大 10MB。背景图保存在浏览器本地，不会上传到服务器。
      </p>
    </div>
  );
}
