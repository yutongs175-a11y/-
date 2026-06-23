import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  initDB,
  getMediaDir,
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getModuleContent,
  getAllModuleContent,
  upsertModuleContent,
  getChatMessages,
  addChatMessage,
  clearChatMessages,
  addMedia,
  getProjectMedia,
  getSceneMedia,
  getLatestSceneImage,
  getLatestSceneVideo,
  getMediaById,
  deleteMedia,
} from './db-index.js';

import { MODULE_CONFIGS, buildProjectContext, type ModuleType } from './agents.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================================
// Static: serve media files
// ============================================================
const MEDIA_DIR = getMediaDir();
app.use('/api/media-files', express.static(MEDIA_DIR));

// ============================================================
// Project Routes
// ============================================================

app.get('/api/projects', async (_req, res) => res.json(await getProjects()));

app.post('/api/projects', async (req, res) => {
  const { title, genre, logline } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  res.json(await createProject(title, genre || '', logline || ''));
});

app.get('/api/projects/:id', async (req, res) => {
  const p = await getProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.put('/api/projects/:id', async (req, res) => {
  await updateProject(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/projects/:id', async (req, res) => {
  await deleteProject(req.params.id);
  res.json({ success: true });
});

// ============================================================
// Module Content Routes
// ============================================================

app.get('/api/projects/:pid/modules/:mid/content', async (req, res) => {
  const c = await getModuleContent(req.params.pid, req.params.mid);
  res.json(c || { content: '', metadata: '{}' });
});

app.put('/api/projects/:pid/modules/:mid/content', async (req, res) => {
  await upsertModuleContent(req.params.pid, req.params.mid, req.body.content || '', req.body.metadata || '{}');
  res.json({ success: true });
});

app.get('/api/projects/:pid/modules', async (req, res) => {
  const all = await getAllModuleContent(req.params.pid);
  const result: Record<string, any> = {};
  for (const mc of all) result[mc.module_type] = { content: mc.content, metadata: mc.metadata };
  res.json(result);
});

// ============================================================
// Chat Messages Routes
// ============================================================

app.get('/api/projects/:pid/modules/:mid/messages', async (req, res) => {
  res.json(await getChatMessages(req.params.pid, req.params.mid));
});

app.delete('/api/projects/:pid/modules/:mid/messages', async (req, res) => {
  await clearChatMessages(req.params.pid, req.params.mid);
  res.json({ success: true });
});

// ============================================================
// Module Config
// ============================================================

app.get('/api/modules', (_req, res) => {
  res.json(Object.values(MODULE_CONFIGS).map(c => ({
    type: c.type, label: c.label, labelEn: c.labelEn,
    icon: c.icon, description: c.description,
    welcomeMessage: c.welcomeMessage, suggestions: c.suggestions,
  })));
});

// ============================================================
// Config Parsers
// ============================================================

interface LLMConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

interface ImgConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

interface VidConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

function parseLLMConfig(headers: Record<string, string | string[] | undefined>): LLMConfig | null {
  const provider = (headers['x-ai-provider'] as string) || '';
  const apiKey = (headers['x-ai-apikey'] as string) || '';
  const model = (headers['x-ai-model'] as string) || '';
  const baseURL = (headers['x-ai-baseurl'] as string) || '';
  if (!provider || !apiKey || !model || !baseURL) return null;
  return { provider, apiKey, model, baseURL };
}

function parseImgConfig(headers: Record<string, string | string[] | undefined>): ImgConfig | null {
  const provider = (headers['x-img-provider'] as string) || '';
  const apiKey = (headers['x-img-apikey'] as string) || '';
  const model = (headers['x-img-model'] as string) || '';
  const baseURL = (headers['x-img-baseurl'] as string) || '';
  if (!provider || !apiKey || !model || !baseURL) return null;
  return { provider, apiKey, model, baseURL };
}

function parseVidConfig(headers: Record<string, string | string[] | undefined>): VidConfig | null {
  const provider = (headers['x-vid-provider'] as string) || '';
  const apiKey = (headers['x-vid-apikey'] as string) || '';
  const model = (headers['x-vid-model'] as string) || '';
  const baseURL = (headers['x-vid-baseurl'] as string) || '';
  if (!provider || !apiKey || !model || !baseURL) return null;
  return { provider, apiKey, model, baseURL };
}

// ============================================================
// LLM Chat (Streaming SSE) — existing
// ============================================================

function streamLLM(
  config: LLMConfig,
  messages: Array<{ role: string; content: string }>,
  onData: (delta: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): void {
  const url = new URL(`${config.baseURL}/chat/completions`);

  const body = JSON.stringify({
    model: config.model,
    messages,
    stream: true,
    max_tokens: 8192,
    temperature: 0.8,
  });

  const isHttps = url.protocol === 'https:';
  const agent = isHttps ? https : http;

  const req = agent.request(
    url.toString(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'text/event-stream',
      },
    },
    (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', (chunk: Buffer) => (errBody += chunk.toString()));
        res.on('end', () => {
          let errMsg = `API 错误 ${res.statusCode}`;
          try {
            const parsed = JSON.parse(errBody);
            errMsg = parsed.error?.message || parsed.message || errMsg;
          } catch {}
          onError(errMsg);
        });
        return;
      }

      let buffer = '';

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onData(content);
          } catch {
            // skip unparseable lines
          }
        }
      });

      res.on('end', () => onDone());
      res.on('error', (err) => onError(err.message));
    }
  );

  req.on('error', (err) => onError(`连接失败: ${err.message}`));
  req.write(body);
  req.end();
}

app.get('/api/projects/:pid/modules/:mid/chat', async (req, res) => {
  const { pid, mid } = req.params;
  const prompt = (req.query.prompt as string) || '';

  if (!prompt) return res.status(400).json({ error: '缺少 prompt 参数' });

  const moduleConfig = MODULE_CONFIGS[mid as ModuleType];
  if (!moduleConfig) return res.status(400).json({ error: '无效的创作模块' });

  const project = await getProject(pid);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const aiConfig = parseLLMConfig(req.headers as Record<string, string | string[] | undefined>);
  if (!aiConfig) {
    return res.status(400).json({
      error: '未配置 AI 密钥。请在左侧栏底部点击 AI 设置，填写你的大模型 API 密钥。',
    });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  await addChatMessage(pid, mid, 'user', prompt);

  const allContent = await getAllModuleContent(pid);
  const context = buildProjectContext(
    { title: project.title, genre: project.genre, logline: project.logline },
    allContent
  );

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: moduleConfig.systemPrompt },
    { role: 'user', content: `${context}\n\n---\n\n【创作者指令】\n${prompt}` },
  ];

  let assistantText = '';
  let done = false;

  streamLLM(
    aiConfig,
    messages,
    (delta) => {
      assistantText += delta;
      send('delta', { text: delta });
    },
    async () => {
      if (done) return;
      done = true;
      if (assistantText) await addChatMessage(pid, mid, 'assistant', assistantText);
      send('done', { provider: aiConfig.provider, model: aiConfig.model });
      res.end();
    },
    (errMsg) => {
      if (done) return;
      done = true;
      const userFriendly = errMsg.includes('401') || errMsg.includes('403')
        ? 'API 密钥无效或已过期。请在设置中检查你的密钥。'
        : errMsg.includes('429')
        ? 'API 调用频率超限，请稍后重试。'
        : `调用 AI 失败: ${errMsg}`;
      send('error', { message: userFriendly });
      res.end();
    },
  );

  setTimeout(() => {
    if (!done) {
      done = true;
      send('error', { message: 'AI 响应超时，请重试。' });
      res.end();
    }
  }, 300000);
});

// ============================================================
// Image Generation
// ============================================================

interface SceneVisualData {
  visualDesc?: string;
  shotSize?: string;
  cameraMove?: string;
  lighting?: string;
  colorTone?: string;
  style?: string;
  description?: string;
}

interface ImageGenRequestOptions {
  customPrompt?: string;
  style?: string;
  aspectRatio?: string;
}

function buildImagePrompt(scene: SceneVisualData, options?: ImageGenRequestOptions): string {
  const customPrompt = options?.customPrompt?.trim();
  
  // If user provided a full custom prompt, use it as the primary prompt
  if (customPrompt) {
    const parts: string[] = [customPrompt];
    
    // Still append scene visual details as supplementary info (unless user seems to have covered it)
    if (scene.shotSize && !customPrompt.toLowerCase().includes('shot')) {
      parts.push(`shot type: ${scene.shotSize}`);
    }
    if (scene.lighting && !customPrompt.toLowerCase().includes('light')) {
      parts.push(`lighting: ${scene.lighting}`);
    }
    if (scene.colorTone && !customPrompt.toLowerCase().includes('color')) {
      parts.push(`color palette: ${scene.colorTone}`);
    }
    
    // Apply style preset if selected
    if (options?.style) {
      parts.push(STYLE_PRESETS[options.style] || options.style);
    }
    
    parts.push('cinematic film still, professional cinematography, high detail, 8K, sharp focus');
    return parts.join(', ');
  }

  // Auto-build prompt from scene data
  const parts: string[] = [];
  const mainDesc = scene.visualDesc || scene.description || '';
  if (mainDesc) parts.push(mainDesc);

  if (scene.shotSize) parts.push(`shot type: ${scene.shotSize}`);
  if (scene.cameraMove) parts.push(`camera movement: ${scene.cameraMove}`);
  if (scene.lighting) parts.push(`lighting: ${scene.lighting}`);
  if (scene.colorTone) parts.push(`color palette: ${scene.colorTone}`);
  if (options?.style) {
    parts.push(STYLE_PRESETS[options.style] || options.style);
  } else if (scene.style) {
    parts.push(`visual style: ${scene.style}`);
  }

  parts.push('cinematic film still, professional cinematography, high detail, 8K, sharp focus');
  return parts.join(', ');
}

// Style presets for image generation
const STYLE_PRESETS: Record<string, string> = {
  cinematic: 'cinematic style, dramatic lighting, film grain, anamorphic lens',
  realistic: 'photorealistic, hyperrealistic, natural lighting, DSLR photography',
  anime: 'anime style, cel shading, vibrant colors, studio anime production',
  noir: 'film noir, black and white, high contrast, dramatic shadows, vintage',
  watercolor: 'watercolor painting style, soft edges, artistic brush strokes',
  oil: 'oil painting style, rich textures, classical art',
  scifi: 'sci-fi concept art, futuristic, neon lights, cyberpunk aesthetic',
  fantasy: 'fantasy art style, ethereal, magical atmosphere, detailed concept art',
};

/**
 * Generate image via Jimeng AI (Volcengine Ark) — compatible with both b64_json and url responses
 */
function generateImageJimeng(
  config: ImgConfig,
  prompt: string,
  size: string,
): Promise<{ b64: string; format: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/images/generations`);
    const body = JSON.stringify({
      model: config.model,
      prompt,
      response_format: 'b64_json',
      size,
      watermark: false,
    });

    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          let msg = `API ${res.statusCode}`;
          try {
            const parsed = JSON.parse(data);
            const errCode = parsed.error?.code || '';
            if (res.statusCode === 403 && errCode === 'PermissionDenied') {
              msg = '模型未开通。请前往火山引擎控制台 → 模型广场 → 开通 Seedream 4.0 模型权限';
            } else if (res.statusCode === 403) {
              msg = `权限不足(${errCode})。请检查火山引擎控制台中该模型的访问权限`;
            } else {
              msg = parsed.error?.message || parsed.message || msg;
            }
          } catch {}
          reject(new Error(msg));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const item = parsed.data?.[0];

          // Handle b64_json response format
          if (item?.b64_json) {
            resolve({ b64: item.b64_json, format: 'png' });
            return;
          }

          // Handle url response format — download the image
          if (item?.url) {
            const imgUrl = item.url;
            const imgProtocol = imgUrl.startsWith('https:') ? https : http;
            imgProtocol.get(imgUrl, (imgRes) => {
              if (imgRes.statusCode !== 200) {
                reject(new Error(`下载图片失败: HTTP ${imgRes.statusCode}`));
                return;
              }
              const chunks: Buffer[] = [];
              imgRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              imgRes.on('end', () => {
                const buf = Buffer.concat(chunks);
                resolve({ b64: buf.toString('base64'), format: 'png' });
              });
              imgRes.on('error', (err) => reject(new Error(`下载图片失败: ${err.message}`)));
            }).on('error', (err) => reject(new Error(`下载图片失败: ${err.message}`)));
            return;
          }

          reject(new Error('API 未返回图片数据'));
        } catch {
          reject(new Error('解析 API 响应失败'));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Generate image via Stability AI (Stable Diffusion)
 */
function generateImageSD(
  config: ImgConfig,
  prompt: string,
  aspectRatio: string,
): Promise<{ b64: string; format: string }> {
  return new Promise((resolve, reject) => {
    const url = config.baseURL; // full URL already

    // Build multipart form data
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const parts: Buffer[] = [];

    // prompt field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`));
    // model field
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${config.model}\r\n`));
    // output format
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="output_format"\r\n\r\npng\r\n`));
    // aspect ratio
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="aspect_ratio"\r\n\r\n${aspectRatio}\r\n`));
    // end
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'image/*',
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          const errText = Buffer.concat(chunks).toString();
          let msg = `API ${res.statusCode}`;
          try {
            const parsed = JSON.parse(errText);
            msg = parsed.message || msg;
          } catch {
            if (errText) msg = errText.slice(0, 200);
          }
          reject(new Error(msg));
          return;
        }
        const imageBuffer = Buffer.concat(chunks);
        resolve({ b64: imageBuffer.toString('base64'), format: 'png' });
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

app.post('/api/projects/:pid/scenes/:sceneNum/image', async (req, res) => {
  const { pid, sceneNum } = req.params;
  const project = await getProject(pid);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const imgConfig = parseImgConfig(req.headers as Record<string, string | string[] | undefined>);
  if (!imgConfig) {
    return res.status(400).json({
      error: '未配置生图 API 密钥。请在设置中填写生图 API 密钥。',
    });
  }

  const body = req.body || {};
  const sceneData: SceneVisualData = body.sceneData || body;
  const options: ImageGenRequestOptions = body.options || {};
  const prompt = buildImagePrompt(sceneData, options);

  // Determine image size from aspect ratio
  const aspectRatio = options.aspectRatio || '16:9';
  const sizeMap: Record<string, string> = {
    '16:9': '2848x1600',
    '9:16': '1600x2848',
    '1:1': '2048x2048',
    '4:3': '2304x1728',
    '3:4': '1728x2304',
    '2.39:1': '3136x1344',
  };
  const imageSize = sizeMap[aspectRatio] || '2848x1600';

  try {
    let result: { b64: string; format: string };

    if (imgConfig.provider === 'jimeng') {
      result = await generateImageJimeng(imgConfig, prompt, imageSize);
    } else if (imgConfig.provider === 'sd') {
      result = await generateImageSD(imgConfig, prompt, aspectRatio);
    } else if (imgConfig.provider === 'custom') {
      // Custom API - assume OpenAI compatible format
      result = await generateImageJimeng(imgConfig, prompt, imageSize);
    } else {
      return res.status(400).json({ error: `不支持的生图提供商: ${imgConfig.provider}` });
    }

    // Save image to file
    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${result.format}`;
    const filePath = path.join(MEDIA_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(result.b64, 'base64'));

    // Save to DB
    const media = await addMedia(pid, sceneNum, 'image', fileName, prompt, imgConfig.provider);

    res.json({
      success: true,
      mediaId: media.id,
      url: `/api/media-files/${fileName}`,
      prompt,
    });
  } catch (err: any) {
    const msg: string = err.message || '生图失败';
    const userFriendly = msg.includes('模型未开通')
      ? msg
      : msg.includes('401') || msg.includes('密钥无效')
      ? '生图 API 密钥无效，请检查设置中的密钥。'
      : msg.includes('403') || msg.includes('权限')
      ? `${msg}`
      : msg.includes('429')
      ? '生图 API 调用频率超限，请稍后重试。'
      : `生图失败: ${msg}`;
    res.status(500).json({ error: userFriendly });
  }
});

// ============================================================
// Video Generation (SSE with polling)
// ============================================================

function buildVideoPrompt(scene: SceneVisualData, options: {
  duration: number;
  cameraMovement: string;
  style: string;
  customPrompt?: string;
}): string {
  const customPrompt = options.customPrompt?.trim();
  
  if (customPrompt) {
    const parts: string[] = [customPrompt];
    if (options.cameraMovement) parts.push(`camera: ${options.cameraMovement}`);
    if (options.style) parts.push(`style: ${options.style}`);
    parts.push('cinematic, smooth motion, professional quality');
    return parts.join(', ');
  }

  const parts: string[] = [];
  const mainDesc = scene.visualDesc || scene.description || '';
  if (mainDesc) parts.push(mainDesc);
  if (scene.shotSize) parts.push(`shot: ${scene.shotSize}`);
  if (options.cameraMovement) parts.push(`camera: ${options.cameraMovement}`);
  if (scene.lighting) parts.push(`lighting: ${scene.lighting}`);
  if (scene.colorTone) parts.push(`color: ${scene.colorTone}`);
  if (options.style || scene.style) parts.push(`style: ${options.style || scene.style}`);
  parts.push('cinematic, smooth motion, professional quality');
  return parts.join(', ');
}

/**
 * Submit video generation task to Jimeng AI via Volcengine Ark API
 * POST https://ark.cn-beijing.volces.com/api/v3/video/generations
 * Returns task_id for polling
 */
function submitJimengVideoTask(
  config: VidConfig,
  prompt: string,
  options: { resolution?: string; ratio?: string; duration?: number; seed?: number; images?: string[] } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use Ark API gateway
    const url = new URL(`${config.baseURL}/video/generations`);
    const body = JSON.stringify({
      model: config.model || 'doubao-seedance-1-0-pro-t2v-250528',
      prompt,
      resolution: options.resolution || '720p',
      ratio: options.ratio || '16:9',
      duration: options.duration || 5,
      seed: options.seed ?? -1,
      ...(options.images && options.images.length > 0 ? { images: options.images } : {}),
    });

    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          let msg = `API ${res.statusCode}`;
          try { const p = JSON.parse(data); msg = p.error?.message || p.message || msg; } catch {}
          reject(new Error(msg));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          // Ark API returns task_id in response
          const taskId = parsed.id || parsed.task_id || parsed.data?.id;
          if (!taskId) reject(new Error('API 未返回任务 ID'));
          else resolve(taskId);
        } catch { reject(new Error('解析 API 响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Poll Jimeng AI video task
 * GET https://ark.cn-beijing.volces.com/api/v3/video/generations/{task_id}
 */
function pollJimengVideoTask(
  config: VidConfig,
  taskId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/video/generations/${taskId}`);
    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`轮询失败 ${res.statusCode}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const status = parsed.status;
          if (status === 'SUCCESS' || status === 'succeeded') {
            const videoUrl = parsed.video_url || parsed.data?.video_url || parsed.result?.video_url;
            if (videoUrl) resolve(videoUrl);
            else reject(new Error('视频生成成功但未返回 URL'));
          } else if (status === 'FAILED' || status === 'failed') {
            reject(new Error(parsed.error?.message || '视频生成失败'));
          } else {
            resolve(''); // still processing
          }
        } catch { reject(new Error('解析轮询响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.end();
  });
}

/**
 * Submit video task to Runway
 */
function submitRunwayVideoTask(
  config: VidConfig,
  prompt: string,
  duration: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/text_to_video`);
    const body = JSON.stringify({
      promptText: prompt,
      duration: duration,
      model: config.model,
    });

    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          let msg = `API ${res.statusCode}`;
          try { const p = JSON.parse(data); msg = p.message || msg; } catch {}
          reject(new Error(msg));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const taskId = parsed.id;
          if (!taskId) reject(new Error('API 未返回任务 ID'));
          else resolve(taskId);
        } catch { reject(new Error('解析 API 响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Poll Runway video task
 */
function pollRunwayVideoTask(
  config: VidConfig,
  taskId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/tasks/${taskId}`);
    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`轮询失败 ${res.statusCode}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const status = parsed.status;
          if (status === 'SUCCEEDED') {
            const videoUrl = parsed.output?.[0];
            if (videoUrl) resolve(videoUrl);
            else reject(new Error('视频生成成功但未返回 URL'));
          } else if (status === 'FAILED') {
            reject(new Error(parsed.failure || '视频生成失败'));
          } else {
            resolve(''); // still processing
          }
        } catch { reject(new Error('解析轮询响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.end();
  });
}

/**
 * Submit video task to Pika
 */
function submitPikaVideoTask(
  config: VidConfig,
  prompt: string,
  duration: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/generate`);
    const body = JSON.stringify({
      promptText: prompt,
      duration: duration,
      aspectRatio: '16:9',
      model: config.model,
    });

    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          let msg = `API ${res.statusCode}`;
          try { const p = JSON.parse(data); msg = p.message || msg; } catch {}
          reject(new Error(msg));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const taskId = parsed.id || parsed.data?.id;
          if (!taskId) reject(new Error('API 未返回任务 ID'));
          else resolve(taskId);
        } catch { reject(new Error('解析 API 响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Poll Pika video task
 */
function pollPikaVideoTask(
  config: VidConfig,
  taskId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}/generate/${taskId}`);
    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? https : http;

    const req = agent.request(url.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`轮询失败 ${res.statusCode}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const status = parsed.status || parsed.data?.status;
          if (status === 'completed' || status === 'succeeded') {
            const videoUrl = parsed.url || parsed.data?.url || parsed.output?.[0];
            if (videoUrl) resolve(videoUrl);
            else reject(new Error('视频生成成功但未返回 URL'));
          } else if (status === 'failed' || status === 'error') {
            reject(new Error(parsed.message || '视频生成失败'));
          } else {
            resolve(''); // still processing
          }
        } catch { reject(new Error('解析轮询响应失败')); }
      });
    });

    req.on('error', (err) => reject(new Error(`连接失败: ${err.message}`)));
    req.end();
  });
}

/**
 * Download a video from URL and save to local file
 */
function downloadVideo(url: string): Promise<{ fileName: string; filePath: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const agent = isHttps ? https : http;

    agent.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`下载视频失败: ${res.statusCode}`));
        return;
      }

      const ext = '.mp4';
      const fileName = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(MEDIA_DIR, fileName);
      const ws = fs.createWriteStream(filePath);

      res.pipe(ws);
      ws.on('finish', () => {
        ws.close();
        resolve({ fileName, filePath });
      });
      ws.on('error', (err) => {
        try { fs.unlinkSync(filePath); } catch {}
        reject(new Error(`保存视频失败: ${err.message}`));
      });
    }).on('error', (err) => reject(new Error(`下载视频失败: ${err.message}`)));
  });
}

app.post('/api/projects/:pid/scenes/:sceneNum/video', async (req, res) => {
  const { pid, sceneNum } = req.params;
  const project = await getProject(pid);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const vidConfig = parseVidConfig(req.headers as Record<string, string | string[] | undefined>);
  if (!vidConfig) {
    return res.status(400).json({
      error: '未配置生视频 API 密钥。请在设置中填写生视频 API 密钥。',
    });
  }

  const { sceneData, options } = req.body || {};
  const prompt = buildVideoPrompt(sceneData || {}, { duration: options?.duration || 5, cameraMovement: options?.cameraMovement || '', style: options?.style || '', customPrompt: options?.customPrompt || '' });

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send('progress', { stage: 'submitting', message: '正在提交视频生成任务...' });

    let taskId: string;
    let pollFn: (config: VidConfig, id: string) => Promise<string>;

    if (vidConfig.provider === 'jimeng') {
      taskId = await submitJimengVideoTask(vidConfig, prompt);
      pollFn = pollJimengVideoTask;
    } else if (vidConfig.provider === 'runway') {
      taskId = await submitRunwayVideoTask(vidConfig, prompt, options?.duration || 5);
      pollFn = pollRunwayVideoTask;
    } else if (vidConfig.provider === 'pika') {
      taskId = await submitPikaVideoTask(vidConfig, prompt, options?.duration || 5);
      pollFn = pollPikaVideoTask;
    } else if (vidConfig.provider === 'custom') {
      // Custom API - assume Jimeng/OpenAI compatible format
      taskId = await submitJimengVideoTask(vidConfig, prompt);
      pollFn = pollJimengVideoTask;
    } else {
      send('error', { message: `不支持的视频提供商: ${vidConfig.provider}` });
      res.end();
      return;
    }

    send('progress', { stage: 'processing', message: `任务已提交 (ID: ${taskId})，正在生成视频...`, taskId });

    // Poll loop
    const maxAttempts = 120; // 120 * 5s = 10 min max
    let videoUrl = '';

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      send('progress', {
        stage: 'processing',
        message: `视频生成中... (已等待 ${(i + 1) * 5}秒)`,
        attempt: i + 1,
      });

      try {
        const result = await pollFn(vidConfig, taskId);
        if (result) {
          videoUrl = result;
          break;
        }
        // empty string = still processing, continue polling
      } catch (err: any) {
        send('error', { message: err.message || '视频生成失败' });
        res.end();
        return;
      }
    }

    if (!videoUrl) {
      send('error', { message: '视频生成超时，请稍后重试。' });
      res.end();
      return;
    }

    send('progress', { stage: 'downloading', message: '视频生成完成，正在下载保存...' });

    // Download and save video
    const { fileName } = await downloadVideo(videoUrl);

    // Save to DB
    const metadata = JSON.stringify(options || {});
    const media = await addMedia(pid, sceneNum, 'video', fileName, prompt, vidConfig.provider, metadata);

    send('done', {
      mediaId: media.id,
      url: `/api/media-files/${fileName}`,
      prompt,
    });
    res.end();
  } catch (err: any) {
    const msg = err.message || '视频生成失败';
    const userFriendly = msg.includes('401') || msg.includes('403')
      ? '生视频 API 密钥无效，请检查设置中的密钥。'
      : msg.includes('429')
      ? '生视频 API 调用频率超限，请稍后重试。'
      : `视频生成失败: ${msg}`;
    send('error', { message: userFriendly });
    res.end();
  }
});

// ============================================================
// Media Routes
// ============================================================

app.get('/api/projects/:pid/media', async (req, res) => {
  const items = await getProjectMedia(req.params.pid);
  res.json(items.map((m) => ({
    ...m,
    url: `/api/media-files/${m.file_path}`,
  })));
});

app.get('/api/media/:id', async (req, res) => {
  const item = await getMediaById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ ...item, url: `/api/media-files/${item.file_path}` });
});

app.delete('/api/media/:id', async (req, res) => {
  await deleteMedia(req.params.id);
  res.json({ success: true });
});

// ============================================================
// Health
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: 'real-llm',
    features: ['chat', 'image-gen', 'video-gen'],
    timestamp: new Date().toISOString(),
  });
});
// ============================================================
// Static: serve built frontend + SPA fallback (production mode)
// ============================================================
const STATIC_DIR = path.join(__dirname, '..');
if (fs.existsSync(path.join(STATIC_DIR, 'index.html'))) {
  app.use(express.static(STATIC_DIR));

  // SPA fallback: non-API & non-static routes → index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });

  console.log(`  Frontend: ${STATIC_DIR}`);
}

// ============================================================
// Start
// ============================================================

(async () => {
  await initDB();
  server.listen(PORT, () => {
  const line = '='.repeat(40);
  console.log(`\n${line}`);
  console.log(`  ScriptCraft AI`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Engine: Real LLM + Image Gen + Video Gen`);
  console.log(`${line}\n`);
  });
})();

export { app, server };
