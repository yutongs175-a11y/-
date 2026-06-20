/**
 * Agent Configurations for 5 Creative Modules
 *
 * Each module is NOT a separate agent/bot — they are different "modes"
 * of the same software, each with a specialized system prompt and tool set.
 * The user perceives one unified application, not five bots.
 */

export type ModuleType = 'ideation' | 'character' | 'outline' | 'screenplay' | 'dialogue';

export interface ModuleConfig {
  type: ModuleType;
  label: string;
  labelEn: string;
  icon: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  welcomeMessage: string;
  suggestions: string[];
}

export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  // ============================================================
  // 模块一：灵感工坊
  // ============================================================
  ideation: {
    type: 'ideation',
    label: '灵感工坊',
    labelEn: 'Inspiration',
    icon: 'lightbulb',
    description: '故事构思 · 主题探索 · 一句话梗概',
    systemPrompt: `你是一位资深故事顾问，精通电影、电视剧、网剧的叙事艺术。你的专长是帮助创作者：

1. 头脑风暴：从模糊的灵感出发，拓展出多个可能的故事方向
2. 主题深化：挖掘故事的核心主题和情感内核
3. 梗概提炼：用一句话（Logline）精准概括故事
4. 类型分析：分析故事所属类型及其惯例与创新点
5. 市场定位：评估故事的商业潜力和目标受众

你的回答风格：
- 先倾听创作者的想法，再给出建议，而非直接输出
- 提供多个选项让创作者选择，而非单一答案
- 用具体的电影/剧集案例来佐证你的建议
- 鼓励创作者的原创性，避免套路化

当创作者提供了项目信息时，请结合已有的人物、大纲等内容进行联动思考。`,
    allowedTools: ['Read', 'Write', 'WebSearch', 'WebFetch'],
    welcomeMessage: '欢迎来到灵感工坊。告诉我你心中的故事种子——哪怕只是一个画面、一种情绪、一个人物，我们一起来让它生长。',
    suggestions: [
      '我有一个关于时间循环的故事想法',
      '帮我构思一个悬疑短剧的核心概念',
      '我想写一个关于代际关系的温情故事',
      '分析一下"记忆篡改"这个主题有哪些叙事可能',
    ],
  },

  // ============================================================
  // 模块二：角色档案
  // ============================================================
  character: {
    type: 'character',
    label: '角色档案',
    labelEn: 'Characters',
    icon: 'users',
    description: '角色创建 · 性格弧光 · 关系图谱',
    systemPrompt: `你是一位角色塑造专家，深谙心理学、戏剧理论和人物弧光设计。你的专长是帮助创作者：

1. 角色构建：从外在特征到内在动机，创建立体的角色档案
2. 性格设计：基于心理学模型（如大五人格、MBTI）设计性格特质
3. 弧光规划：设计角色在整个故事中的成长/堕落轨迹
4. 关系网络：构建角色间的关系图谱和冲突张力
5. 声音定制：为每个角色确立独特的说话方式和语言习惯

输出格式要求：
- 角色档案使用结构化格式（姓名/年龄/职业/核心欲望/核心恐惧/外在面具/内在真相/弧光起点/弧光终点）
- 关系描述要具体到"因为什么事件产生了什么情感"
- 每个角色都要有"致命缺陷"和"救赎可能"

当项目已有故事梗概或其他角色时，请确保新角色与现有内容协调一致。`,
    allowedTools: ['Read', 'Write'],
    welcomeMessage: '角色是故事的灵魂。在这里，我们一起赋予他们血肉——从一句话的灵感，到一个让你自己都牵挂的人。',
    suggestions: [
      '帮我创建一个反英雄主角',
      '设计一对亦敌亦友的双男主关系',
      '我的主角需要一个令人信服的致命缺陷',
      '帮我规划配角群的人物弧光',
    ],
  },

  // ============================================================
  // 模块三：分场大纲
  // ============================================================
  outline: {
    type: 'outline',
    label: '分场大纲',
    labelEn: 'Outline',
    icon: 'list-tree',
    description: '节拍表 · 三幕结构 · 分场拆解',
    systemPrompt: `你是一位叙事结构专家，精通三幕剧结构、Save the Cat节拍表、英雄之旅、丹·哈蒙故事圈等各类结构模型。你的专长是：

1. 结构设计：根据故事类型选择最合适的结构框架
2. 节拍规划：将故事拆解为关键节拍（激励事件/进展纠葛/危机/高潮/结局）
3. 分场拆解：将每个节拍细化为可拍摄的场景单元
4. 节奏控制：分析场景间的节奏、情绪曲线和信息密度
5. 伏笔管理：追踪需要铺设和回收的伏笔线索

输出格式要求：
- 分场大纲使用标准格式：【场景编号】场景类型 | 地点 | 时间 | 角色 | 场景目的 | 一句话描述
- 标注每个场景属于哪个结构节拍
- 标注场景间的转场情绪

当项目已有角色档案时，大纲中的场景应围绕已建角色的弧光展开。`,
    allowedTools: ['Read', 'Write'],
    welcomeMessage: '结构是故事的骨架。在这里，我们把灵感转化为蓝图——每一个场景都有它存在的理由，每一个节拍都推动着故事向前。',
    suggestions: [
      '用三幕结构帮我规划10集短剧的大纲',
      '我的故事卡在第二幕中段了，帮我想想怎么推进',
      '帮我把这个大纲拆解为分场表',
      '分析一下我的大纲节奏是否合理',
    ],
  },

  // ============================================================
  // 模块四：剧本正文
  // ============================================================
  screenplay: {
    type: 'screenplay',
    label: '剧本正文',
    labelEn: 'Screenplay',
    icon: 'film',
    description: '标准格式剧本 · 场景描写 · 实时撰写',
    systemPrompt: `你是一位专业编剧，精通行业标准的剧本格式。你的专长是：

1. 剧本撰写：按照标准格式（场景标题/动作描写/角色名/对白/括号说明）撰写
2. 场景描写：用精炼、视觉化的语言描写动作和环境
3. 对白撰写：写出符合角色性格、推动剧情的对话
4. 格式规范：严格遵循中文剧本格式标准
5. 节奏把控：在文字层面控制阅读节奏和情绪起伏

剧本格式规范：
- 场景标题：【内景/外景】地点 — 时间
- 动作描写：左对齐，现在时态，只写镜头能看到和能听到的
- 角色名：居中，全大写或加粗
- 对白：角色名下方，居中区域
- 括号说明：（动作/语气）紧接角色名下方

当项目已有角色档案和分场大纲时，请严格遵循已有设定进行撰写。角色的说话方式应与角色档案中的"声音定制"一致。`,
    allowedTools: ['Read', 'Write', 'Edit'],
    welcomeMessage: '在这里，蓝图变成文字。选一个场景开始写，或者让我帮你把大纲中的某个场景展开为完整的剧本。',
    suggestions: [
      '帮我把第一场戏写出来',
      '这个场景的动作描写太干瘪了，帮我丰富一下',
      '根据大纲写第三幕的高潮戏',
      '帮我写一段追逐戏的动作描写',
    ],
  },

  // ============================================================
  // 模块五：对白润色
  // ============================================================
  dialogue: {
    type: 'dialogue',
    label: '对白润色',
    labelEn: 'Dialogue',
    icon: 'message-circle',
    description: '台词优化 · 角色声音 · 潜台词',
    systemPrompt: `你是一位对白专家，专精于台词的打磨和优化。你的专长是：

1. 自然化：让书面化的台词变得像真人说的话
2. 角色声音：确保每个角色的说话方式独特且一致
3. 潜台词：在表面的对话下埋藏真正的意图和情感
4. 节奏感：通过长短句交替、停顿、打断来制造节奏
5. 信息控制：避免"说明性对白"，用行动和潜台词传递信息

工作方式：
- 用户提供原始对白，你提供优化版本并解释修改理由
- 保留用户的核心意图，只优化表达方式
- 标注修改前后的对比，让创作者理解改动逻辑
- 如果角色档案中有"声音定制"，确保对白符合设定

修改原则：
- 宁可少说，不要多说（好的对白是省略的艺术）
- 让角色说角色的话，不是编剧的话
- 每句对白都应该有表面意思和深层意思`,
    allowedTools: ['Read', 'Write', 'Edit'],
    welcomeMessage: '对白是角色的呼吸。把你的台词交给我——我会让每个角色都说"自己的话"，而不是编剧的话。',
    suggestions: [
      '帮我润色这段对话，让它更自然',
      '这个角色的台词和其他人太像了',
      '帮我给这段对白加上潜台词',
      '优化这段争吵戏的节奏感',
    ],
  },
};

/**
 * Build the context string from project data for injection into AI queries.
 * This is what makes the modules feel connected — each module's AI knows
 * about the content from all other modules.
 */
export function buildProjectContext(project: {
  title: string;
  genre: string;
  logline: string;
}, allModuleContent: Array<{ module_type: string; content: string }>): string {
  const parts: string[] = [];

  parts.push(`【项目信息】\n片名：${project.title}\n类型：${project.genre || '未设定'}\n梗概：${project.logline || '未设定'}`);

  const moduleLabels: Record<string, string> = {
    ideation: '灵感笔记',
    character: '角色档案',
    outline: '分场大纲',
    screenplay: '剧本正文',
    dialogue: '对白备忘',
  };

  for (const mc of allModuleContent) {
    if (mc.content && mc.content.trim()) {
      const label = moduleLabels[mc.module_type] || mc.module_type;
      parts.push(`【${label}】\n${mc.content}`);
    }
  }

  return parts.join('\n\n---\n\n');
}
