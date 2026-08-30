// Translation dictionaries. `zh` is typed as `typeof en`, so TypeScript
// enforces that both languages define exactly the same key set.
// Placeholders like {n} / {status} are interpolated by the t() helper.

const en = {
  // Corner controls
  'controls.language': 'Language',
  'controls.help': 'Help',

  // Header
  'header.tagline':
    'Describe a story, tweak the AI-written script, then watch it come to life in a 4-panel comic strip!',

  // Input form
  'form.placeholder': "Describe your comic idea... e.g., 'A robot trying to eat spaghetti for the first time'",
  'form.create': 'CREATE',
  'form.scriptModel': 'Script model',
  'form.artStyle': 'Art style',
  'form.imageModel': 'Image model',
  'form.keyNotSet': '(key not set)',

  // Status
  'status.writingScript': 'Writing the script...',
  'status.inkingPanels': 'Inking the panels...',
  'status.reviewHint': 'Review the script below, tweak it, then hit DRAW.',
  'status.error': 'Oops! Something went wrong. Try again.',

  // Buttons
  'button.cancel': 'CANCEL',
  'button.save': 'Save Image',
  'button.saving': 'Saving...',
  'button.startOver': 'Start Over',
  'button.draw': 'DRAW THE COMIC',
  'button.retry': 'Retry',

  // Script editor
  'editor.title': 'Title',
  'editor.untitled': 'Untitled comic',
  'editor.hint': 'The AI wrote this script — edit any line before the panels are drawn.',
  'editor.panel': 'PANEL #{n}',
  'editor.caption': 'Caption',
  'editor.speaker': 'Speaker',
  'editor.dialogue': 'Dialogue',
  'editor.visualPrompt': 'Visual prompt',
  'editor.captionPlaceholder': 'Meanwhile...',
  'editor.speakerPlaceholder': 'Robot',
  'editor.dialoguePlaceholder': 'Why is this so slippery?',
  'editor.visualPromptPlaceholder': 'Describe the scene...',

  // Comic panel
  'panel.drawing': 'Drawing...',
  'panel.noImage': 'No image yet.',
  'panel.redraw': 'Redraw panel {n}',
  'panel.alt': 'Panel {n}: {description}',
  'panel.cancelled': 'Cancelled.',
  'panel.rateLimited': 'Rate limited — wait a moment, then retry.',
  'panel.authRejected': 'The image API rejected the key.',
  'panel.network': 'Could not reach the server.',
  'panel.failed': 'Failed to generate this panel.',

  // Onboarding
  'onboarding.step1.title': 'Write an Idea',
  'onboarding.step1.text': '"A cat becomes mayor of a small town"',
  'onboarding.step2.title': 'AI Scripts It',
  'onboarding.step2.text': 'Your chosen AI writes the panels and dialogue — and you can edit every line.',
  'onboarding.step3.title': 'Review & Draw',
  'onboarding.step3.text': 'Pick an art style, tweak the script, then generate your comic.',

  // Footer
  'footer.credit': 'Script by {script} · Images by {image} · {style} style · AI can make mistakes.',

  // Art-style display names (keys must match STYLE_PRESETS ids)
  'style.comic': 'Comic Book',
  'style.manga': 'Manga',
  'style.noir': 'Noir',
  'style.watercolor': 'Watercolor',
  'style.cartoon': 'Cartoon',

  // Errors
  'error.title': 'Error',
  'error.scriptFailed': 'Failed to generate the comic script.',
  'error.downloadFailed': 'Sorry, the comic could not be exported as an image. Please try again.',
  'error.context.network': 'The server could not be reached. Check your connection and try again.',
  'error.context.auth': 'The API key was rejected ({status}). Check the server configuration.',
  'error.context.notFound':
    'The API endpoint was not found. If you deployed only the static build, the /api functions are missing — see the README.',
  'error.context.rateLimit': 'The AI service is rate limited or out of quota. Wait a moment and try again.',

  // Error boundary
  'boundary.text': 'Something went wrong while rendering the page.',
  'boundary.reload': 'Reload the page',

  // Help manual
  'help.title': 'User Guide',
  'help.close': 'Close',
  'help.quickStart.title': 'Quick Start',
  'help.step1.title': '1. Describe your idea',
  'help.step1.text':
    'Type a one-line story idea (e.g. "a cat becomes mayor of a small town"), then pick a script model, an art style and an image model below the box.',
  'help.step2.title': '2. Generate the script',
  'help.step2.text':
    'Click CREATE. The script model writes a 4-panel script — title, descriptions, dialogue and visual prompts. This takes 20–60 seconds depending on the model; you can cancel at any time.',
  'help.step3.title': '3. Review & edit',
  'help.step3.text':
    'The script opens in an editor before any image is drawn. Fix the title, rewrite dialogue, or tune each panel\'s visual prompt — editing is free and saves image-generation quota.',
  'help.step4.title': '4. Draw & save',
  'help.step4.text':
    'Click DRAW THE COMIC. Panels are drawn one by one; hover a finished panel and click the round button to redraw it, or Retry a failed one. When done, use Save Image to export the whole strip as a PNG.',
  'help.params.title': 'What each option does',
  'help.param.scriptModel': 'Script model — who writes the script (title, panel breakdown, dialogue). Runs once per comic.',
  'help.param.scriptModel.gemini':
    'Gemini 2.5 Flash: Google\'s model with structured output. Needs GEMINI_API_KEY on the server; the option is disabled when the key is missing.',
  'help.param.scriptModel.gpt55': 'GPT-5.5: deep-thinking model, best script quality, slower (about 20–50 seconds).',
  'help.param.scriptModel.gpt56': 'GPT-5.6 Sol / Terra: quicker GPT alternatives; try them to compare style and speed.',
  'help.param.artStyle': "Art style — the drawing style appended to every panel's prompt.",
  'help.param.artStyle.comic': 'Comic Book: bold outlines, cel shading, vivid colors.',
  'help.param.artStyle.manga': 'Manga: black & white, screentone shading, dynamic linework.',
  'help.param.artStyle.noir': 'Noir: high-contrast black & white, hard shadows, detective mood.',
  'help.param.artStyle.watercolor': 'Watercolor: soft pastels, paper texture, gentle brushwork.',
  'help.param.artStyle.cartoon': 'Cartoon: flat shapes, bright playful colors.',
  'help.param.imageModel': 'Image model — who draws each panel. Runs once per panel (and again on redraw).',
  'help.param.imageModel.gpt2': 'GPT Image 2: 1024×1024 panels, the standard choice.',
  'help.param.imageModel.gpt2_4k':
    'GPT Image 2 4K: higher resolution, noticeably slower; on serverless deployments it may exceed response size limits.',
  'help.editing.title': 'Editing the script',
  'help.editing.intro': 'In the script editor every field is optional except the visual prompt:',
  'help.field.title': "Title — the strip's headline, also used as the PNG file name.",
  'help.field.caption': 'Caption — narrator text in the yellow box at the panel\'s top-left (e.g. "Meanwhile...").',
  'help.field.speaker': 'Speaker — the character\'s name shown above the dialogue bubble.',
  'help.field.dialogue': 'Dialogue — what they say, shown in the bubble at the bottom of the panel.',
  'help.field.visualPrompt':
    'Visual prompt — what the image model actually sees; describe the scene, characters, action and composition. Clearer prompts give more consistent art.',
  'help.faq.title': 'Troubleshooting',
  'help.faq.geminiKey':
    '"GEMINI_API_KEY is not configured" — you picked the Gemini script writer but no key is set. Choose a GPT script model instead, or add the key to .env.local.',
  'help.faq.rateLimit':
    '"Rate limited" — the AI service is throttling you. Wait a minute and retry; the app already retries automatically with backoff.',
  'help.faq.keyNotSet': '"(key not set)" next to a model — that model\'s API key is not configured on the server, so it cannot be selected.',
  'help.faq.keys':
    'Where do the keys live? Server-side only: .env.local for local development, or the Vercel project environment variables in production. They are never exposed to the browser.',
};

export type TranslationKey = keyof typeof en;
export type Language = 'zh' | 'en';

const zh: typeof en = {
  // 角落控件
  'controls.language': '语言',
  'controls.help': '使用说明',

  // 页头
  'header.tagline': '描述一个故事，修改 AI 写好的剧本，然后看它变成一幅四格漫画！',

  // 输入表单
  'form.placeholder': '描述你的漫画创意……例如：「一个机器人第一次尝试吃意大利面」',
  'form.create': '开始创作',
  'form.scriptModel': '剧本模型',
  'form.artStyle': '画风',
  'form.imageModel': '画图模型',
  'form.keyNotSet': '（未配置密钥）',

  // 状态
  'status.writingScript': '正在编写剧本……',
  'status.inkingPanels': '正在绘制分格……',
  'status.reviewHint': '在下方检查剧本，随意修改，然后点击「绘制漫画」。',
  'status.error': '哎呀！出了点问题，请重试。',

  // 按钮
  'button.cancel': '取消',
  'button.save': '保存图片',
  'button.saving': '保存中……',
  'button.startOver': '重新开始',
  'button.draw': '绘制漫画',
  'button.retry': '重试',

  // 剧本编辑
  'editor.title': '标题',
  'editor.untitled': '未命名漫画',
  'editor.hint': '这份剧本由 AI 生成——绘制前可以修改其中任何内容。',
  'editor.panel': '第 {n} 格',
  'editor.caption': '旁白',
  'editor.speaker': '说话人',
  'editor.dialogue': '对白',
  'editor.visualPrompt': '画面描述',
  'editor.captionPlaceholder': '与此同时……',
  'editor.speakerPlaceholder': '机器人',
  'editor.dialoguePlaceholder': '这东西怎么这么滑？',
  'editor.visualPromptPlaceholder': '描述这一格的画面……',

  // 漫画分格
  'panel.drawing': '绘制中……',
  'panel.noImage': '暂无图片',
  'panel.redraw': '重绘第 {n} 格',
  'panel.alt': '第 {n} 格：{description}',
  'panel.cancelled': '已取消。',
  'panel.rateLimited': '请求过于频繁——稍等片刻后重试。',
  'panel.authRejected': '图片 API 拒绝了密钥。',
  'panel.network': '无法连接服务器。',
  'panel.failed': '这一格生成失败。',

  // 引导卡片
  'onboarding.step1.title': '写下创意',
  'onboarding.step1.text': '「一只猫当上了小镇镇长」',
  'onboarding.step2.title': 'AI 写剧本',
  'onboarding.step2.text': '由你选择的 AI 编写分格与对白——每一行都可以修改。',
  'onboarding.step3.title': '检查并绘制',
  'onboarding.step3.text': '选择画风、微调剧本，然后生成你的漫画。',

  // 页脚
  'footer.credit': '剧本：{script} · 绘图：{image} · {style}风格 · AI 可能出错',

  // 画风名称（键须与 STYLE_PRESETS 的 id 一致）
  'style.comic': '美漫',
  'style.manga': '日漫',
  'style.noir': '黑白 Noir',
  'style.watercolor': '水彩',
  'style.cartoon': '卡通',

  // 错误
  'error.title': '错误',
  'error.scriptFailed': '剧本生成失败。',
  'error.downloadFailed': '抱歉，漫画导出图片失败，请重试。',
  'error.context.network': '无法连接服务器，请检查网络后重试。',
  'error.context.auth': 'API 密钥被拒绝（{status}），请检查服务端配置。',
  'error.context.notFound': '未找到 API 端点。如果只部署了静态站点，/api 函数会缺失——部署说明见 README。',
  'error.context.rateLimit': 'AI 服务已限流或配额耗尽，请稍后重试。',

  // 渲染错误兜底页
  'boundary.text': '页面渲染时出现了问题。',
  'boundary.reload': '重新加载页面',

  // 使用说明书
  'help.title': '使用说明书',
  'help.close': '关闭',
  'help.quickStart.title': '快速上手',
  'help.step1.title': '1. 描述你的创意',
  'help.step1.text': '在输入框写下一句话创意（例如「一只猫当上了小镇镇长」），然后在下方选择剧本模型、画风和画图模型。',
  'help.step2.title': '2. 生成剧本',
  'help.step2.text': '点击「开始创作」，剧本模型会写出四格剧本——标题、画面描述、对白和旁白。视模型不同约需 20–60 秒，期间可随时取消。',
  'help.step3.title': '3. 检查与编辑',
  'help.step3.text': '剧本会先进入编辑界面，此时还没有消耗图片额度。你可以改标题、改对白、微调每一格的画面描述——编辑是免费的。',
  'help.step4.title': '4. 绘制与保存',
  'help.step4.text': '点击「绘制漫画」，分格会逐格生成。鼠标悬停在完成的分格上，点右上角圆形按钮可重绘；失败的分格可点「重试」。完成后点「保存图片」导出整幅 PNG。',
  'help.params.title': '各选项的含义',
  'help.param.scriptModel': '剧本模型——决定由谁写剧本（标题、分镜、对白）。每幅漫画调用一次。',
  'help.param.scriptModel.gemini':
    'Gemini 2.5 Flash：Google 的模型，结构化输出。需要在服务端配置 GEMINI_API_KEY，未配置时该选项不可选。',
  'help.param.scriptModel.gpt55': 'GPT-5.5：深度思考型模型，剧本质量最好，较慢（约 20–50 秒）。',
  'help.param.scriptModel.gpt56': 'GPT-5.6 Sol / Terra：更快的 GPT 模型，风格与速度各有差异，可自行尝试。',
  'help.param.artStyle': '画风——附加到每一格画面描述中的绘画风格。',
  'help.param.artStyle.comic': '美漫：粗线条勾边、色块着色、色彩鲜明。',
  'help.param.artStyle.manga': '日漫：黑白画面、网点纸阴影、线条动感。',
  'help.param.artStyle.noir': '黑色电影：高对比黑白、浓重阴影、侦探氛围。',
  'help.param.artStyle.watercolor': '水彩：柔和粉彩、纸纹质感、笔触轻柔。',
  'help.param.artStyle.cartoon': '卡通：现代扁平造型、明快活泼的色彩。',
  'help.param.imageModel': '画图模型——决定由谁绘制每一格。每格调用一次（重绘也会重新调用）。',
  'help.param.imageModel.gpt2': 'GPT Image 2：1024×1024 分辨率，标准选择。',
  'help.param.imageModel.gpt2_4k': 'GPT Image 2 4K：分辨率更高但明显更慢；在 serverless 部署环境下可能超出响应体积限制。',
  'help.editing.title': '编辑剧本',
  'help.editing.intro': '编辑界面中除了画面描述外，其余字段都可以留空：',
  'help.field.title': '标题——漫画的标题，也会用作导出 PNG 的文件名。',
  'help.field.caption': '旁白——显示在分格左上角黄色框中的叙事文字（如「与此同时……」）。',
  'help.field.speaker': '说话人——显示在对白气泡上方的角色名。',
  'help.field.dialogue': '对白——角色说的话，显示在分格底部的气泡里。',
  'help.field.visualPrompt': '画面描述——画图模型实际看到的提示词，描述场景、角色、动作与构图。写得越清楚，画面越符合预期。',
  'help.faq.title': '常见问题',
  'help.faq.geminiKey':
    '提示「GEMINI_API_KEY is not configured」——你选择了 Gemini 写剧本但服务端没有配置密钥。改选 GPT 系列模型，或在 .env.local 中补上密钥即可。',
  'help.faq.rateLimit': '提示「请求过于频繁」——AI 服务正在限流。稍等一分钟再重试；应用本身已带自动退避重试。',
  'help.faq.keyNotSet': '模型旁的「（未配置密钥）」——表示服务端没有配置该模型所需的 API 密钥，因此无法选择。',
  'help.faq.keys':
    '密钥放在哪里？只在服务端：本地开发在 .env.local，生产环境在 Vercel 项目的环境变量中。任何情况下都不会暴露给浏览器。',
};

export const translations: Record<Language, typeof en> = { zh, en };
export const DEFAULT_LANGUAGE: Language = 'zh';
