import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'zh' | 'en';

// ── Translation dictionary ──
const dict: Record<string, Record<Lang, string>> = {
  // Common
  'app.title': { zh: '🧊 Icebreaker — AI 招聘邮件生成器', en: '🧊 Icebreaker — AI Recruiting Email Writer' },
  'app.tagline': { zh: '让候选人感受到被认真对待', en: 'Make every candidate feel valued' },

  // Nav
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.settings': { zh: '设置', en: 'Settings' },
  'nav.logout': { zh: '退出', en: 'Logout' },
  'nav.login': { zh: '登录', en: 'Login' },
  'nav.register': { zh: '注册', en: 'Register' },

  // Step 1
  'step1.title': { zh: '候选人信息', en: 'Candidate Information' },
  'step1.subtitle': { zh: '上传简历、粘贴文本、导入 CSV 或抓取网页', en: 'Upload resume, paste text, CSV, or fetch a URL' },
  'step1.tabFile': { zh: '上传文件', en: 'Upload File' },
  'step1.tabText': { zh: '粘贴文本', en: 'Paste Text' },
  'step1.tabCsv': { zh: 'CSV / Excel', en: 'CSV / Excel' },
  'step1.tabUrl': { zh: '网址抓取', en: 'URL' },
  'step1.parsedText': { zh: '解析结果（可编辑）', en: 'Parsed Text (editable)' },
  'step1.textPlaceholder': { zh: '粘贴候选人的简历、LinkedIn 或任何背景信息…', en: "Paste the candidate's resume, LinkedIn, or any background info..." },
  'step1.textTooShort': { zh: '⚠️ 文本太短，至少需要 10 个字符', en: '⚠️ Text too short (min 10 chars)' },
  'step1.csvHint': { zh: '上传 CSV 或 Excel 文件，需包含 name、email、background 列', en: 'Upload CSV/Excel with columns: name, email, background' },
  'step1.chooseFile': { zh: '选择文件', en: 'Choose File' },
  'step1.parsing': { zh: '解析中…', en: 'Parsing...' },
  'step1.candidatesLoaded': { zh: '个候选人已加载', en: ' candidate(s) loaded' },
  'step1.urlHint': { zh: '每行粘贴一个网址，支持个人主页、GitHub、Google Sites 等', en: 'One URL per line — personal sites, GitHub, Google Sites, etc.' },
  'step1.importUrls': { zh: '导入网址', en: 'Import URLs' },
  'step1.importing': { zh: '导入中…', en: 'Importing...' },
  'step1.imported': { zh: '成功', en: 'imported' },
  'step1.failed': { zh: '失败', en: 'failed' },
  'step1.selectedCandidate': { zh: '当前选中的候选人文本（可编辑）', en: 'Selected Candidate Text (editable)' },
  'step1.urlParsedText': { zh: '抓取结果（可编辑）', en: 'Parsed Content (editable)' },
  'step1.targetRole': { zh: '目标职位（选填）', en: 'Target Role (optional)' },
  'step1.continue': { zh: '继续设置', en: 'Continue to Settings' },

  // File dropzone
  'dropzone.drop': { zh: '拖拽简历到此处，或点击选择', en: 'Drop resume here or click to select' },
  'dropzone.supported': { zh: '支持 PDF、Word、图片（JPG/PNG/WebP）', en: 'Supports PDF, Word, Images (JPG/PNG/WebP)' },
  'dropzone.parsing': { zh: '正在解析…', en: 'Parsing...' },
  'dropzone.clear': { zh: '清除', en: 'Clear' },

  // Step 2
  'step2.title': { zh: '邮件设置', en: 'Email Settings' },
  'step2.profile': { zh: '发件人身份', en: 'Sender Profile' },
  'step2.manageProfiles': { zh: '管理身份', en: 'Manage Profiles' },
  'step2.emailCount': { zh: '生成数量', en: 'Number of Emails' },
  'step2.count1': { zh: '1 封', en: '1 email' },
  'step2.count2': { zh: '2 封', en: '2 emails' },
  'step2.count3': { zh: '3 封', en: '3 emails' },
  'step2.style': { zh: '邮件风格', en: 'Email Style' },
  'step2.recommended': { zh: '推荐', en: 'Recommended' },
  'step2.used': { zh: '已使用', en: 'used' },
  'step2.language': { zh: '语言', en: 'Language' },
  'step2.back': { zh: '返回', en: 'Back' },
  'step2.generate': { zh: '生成邮件', en: 'Generate Email' },
  'step2.generating': { zh: '生成中…', en: 'Generating...' },

  // Step 2 — free quota
  'quota.free': { zh: '🎉 剩余', en: '🎉' },
  'quota.remaining': { zh: '次免费生成 — 使用系统默认 Key', en: ' free generation(s) remaining — powered by system key' },
  'quota.unlimited': { zh: '无限次', en: 'Unlimited' },
  'quota.addKey': { zh: '添加你自己的 Key', en: 'Add your key' },
  'quota.warning': { zh: '⚠️ 免费次数即将用完！', en: '⚠️ Almost out of free generations!' },
  'quota.warningAdd': { zh: '添加你自己的 API Key', en: 'Add your own API key' },
  'quota.warningContinue': { zh: '以继续生成', en: 'to keep generating' },

  // Step 3
  'step3.title': { zh: '生成结果', en: 'Generated Emails' },
  'step3.regenerate': { zh: '重新生成', en: 'Regenerate' },
  'step3.modify': { zh: '修改设置', en: 'Modify Settings' },
  'step3.translateTo': { zh: '翻译为', en: 'Translate to' },
  'step3.translateAllTo': { zh: '全部翻译为', en: 'Translate all to' },
  'step3.translating': { zh: '翻译中…', en: 'Translating...' },
  'step3.copy': { zh: '复制', en: 'Copy' },
  'step3.copied': { zh: '已复制！', en: 'Copied!' },
  'step3.edit': { zh: '编辑', en: 'Edit' },
  'step3.save': { zh: '保存', en: 'Save' },
  'step3.cancel': { zh: '取消', en: 'Cancel' },

  // Profile Manager
  'profile.title': { zh: '发件人身份管理', en: 'Sender Profiles' },
  'profile.add': { zh: '添加身份', en: 'Add Profile' },
  'profile.name': { zh: '姓名', en: 'Name' },
  'profile.title_field': { zh: '职位', en: 'Title' },
  'profile.company': { zh: '公司', en: 'Company' },
  'profile.role': { zh: '角色类型', en: 'Role' },
  'profile.signature': { zh: '签名', en: 'Signature' },
  'profile.personalNote': { zh: '个人备注（选填）', en: 'Personal Note (optional)' },
  'profile.create': { zh: '创建', en: 'Create' },
  'profile.update': { zh: '更新', en: 'Update' },
  'profile.delete': { zh: '删除', en: 'Delete' },

  // Login / Register
  'auth.login': { zh: '登录', en: 'Login' },
  'auth.register': { zh: '注册', en: 'Register' },
  'auth.email': { zh: '邮箱', en: 'Email' },
  'auth.password': { zh: '密码', en: 'Password' },
  'auth.name': { zh: '姓名', en: 'Name' },
  'auth.loginBtn': { zh: '登录', en: 'Sign In' },
  'auth.registerBtn': { zh: '注册', en: 'Sign Up' },
  'auth.noAccount': { zh: '没有账号？', en: "Don't have an account?" },
  'auth.hasAccount': { zh: '已有账号？', en: 'Already have an account?' },
  'auth.registering': { zh: '注册中…', en: 'Registering...' },

  // Settings
  'settings.title': { zh: '设置', en: 'Settings' },
  'settings.apiKeys': { zh: 'API Keys', en: 'API Keys' },
  'settings.addKey': { zh: '添加 Key', en: 'Add Key' },
  'settings.cancel': { zh: '取消', en: 'Cancel' },
  'settings.provider': { zh: '模型供应商', en: 'Provider' },
  'settings.model': { zh: '模型', en: 'Model' },
  'settings.modelHint': { zh: '（建议列表 — 也可手动输入任意版本）', en: ' (suggestions — or type any version)' },
  'settings.label': { zh: '标签（选填）', en: 'Label (optional)' },
  'settings.apiKey': { zh: 'API Key', en: 'API Key' },
  'settings.howToGet': { zh: '如何获取', en: 'How to get a' },
  'settings.key': { zh: '的 Key？', en: ' key?' },
  'settings.addingKey': { zh: '添加中…', en: 'Adding...' },
  'settings.addKeyBtn': { zh: '添加 Key', en: 'Add Key' },
  'settings.noKeys': { zh: '还没有 API Key，点击上方添加 — 或者使用免费额度', en: 'No API keys yet. Add one or use free system quota.' },
  'settings.systemDefault': { zh: '系统默认', en: 'System Default' },
  'settings.setDefault': { zh: '设为默认', en: 'Set Default' },
  'settings.migrate': { zh: '迁移', en: 'Migrate' },
  'settings.legacyFound': { zh: '检测到旧的 DashScope Key，迁移到新系统？', en: 'You have a legacy DashScope key. Migrate?' },
  'settings.migrating': { zh: '迁移中…', en: 'Migrating...' },
  'settings.done': { zh: '完成', en: 'Done' },
  'settings.quotaInfo': { zh: '免费额度 — 系统默认 Key', en: 'Free quota — system default key' },
  'settings.keyUsage': { zh: 'API Key 使用统计', en: 'API Key Usage' },
  'settings.usersWithKeys': { zh: '个用户已配置 Key', en: ' users with keys' },
  'settings.inviteTokens': { zh: '邀请链接', en: 'Invite Tokens' },
  'settings.newInvite': { zh: '新建邀请', en: 'New invite' },
  'settings.creating': { zh: '创建中…', en: 'Creating...' },
  'settings.userStats': { zh: '用户生成统计', en: 'User Generation Stats' },
  'settings.userGrowth': { zh: '用户增长（近 30 天）', en: 'User Growth (Last 30 Days)' },

  // Styles
  'style.PROFESSIONAL': { zh: '专业正式', en: 'Professional' },
  'style.WARM': { zh: '温暖亲切', en: 'Warm' },
  'style.CONCISE': { zh: '简洁直接', en: 'Concise' },
  'style.STORYTELLING': { zh: '讲故事', en: 'Storytelling' },

  // Roles
  'role.HR': { zh: 'HR', en: 'HR' },
  'role.INTERVIEWER': { zh: '面试官', en: 'Interviewer' },
  'role.EXECUTIVE': { zh: '高管', en: 'Executive' },
  'role.REFERRAL': { zh: '内推人', en: 'Referral' },
  'role.CUSTOM': { zh: '自定义', en: 'Custom' },

  // Step Indicator
  'step.1': { zh: '候选人信息', en: 'Candidate Info' },
  'step.2': { zh: '邮件设置', en: 'Email Settings' },
  'step.3': { zh: '生成结果', en: 'Generated Emails' },

  // API Key guides
  'guide.deepseek': { zh: 'DeepSeek 申请步骤', en: 'DeepSeek Setup Guide' },
  'guide.dashscope': { zh: 'DashScope 申请步骤', en: 'DashScope Setup Guide' },
  'guide.openai': { zh: 'OpenAI 申请步骤', en: 'OpenAI Setup Guide' },
  'guide.moonshot': { zh: 'Kimi 申请步骤', en: 'Kimi Setup Guide' },
  'guide.zhipu': { zh: '智谱 GLM 申请步骤', en: 'Zhipu GLM Setup Guide' },
  'guide.bytedance': { zh: '豆包 申请步骤', en: 'Doubao Setup Guide' },
  'guide.gemini': { zh: 'Gemini 申请步骤', en: 'Gemini Setup Guide' },
  'guide.stepfun': { zh: '阶跃星辰 申请步骤', en: 'StepFun Setup Guide' },
  'guide.minimax': { zh: 'MiniMax 申请步骤', en: 'MiniMax Setup Guide' },

  // Empty states
  'empty.selectProfile': { zh: '请先选择一个发件人身份', en: 'Select a sender profile first' },
  'empty.noEmails': { zh: '暂无生成结果', en: 'No emails generated yet' },
};

// ── Context ──
interface I18nContextType {
  lang: Lang;
  t: (key: string) => string;
  toggleLang: () => void;
}
const I18nContext = createContext<I18nContextType>({ lang: 'zh', t: (k) => k, toggleLang: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('icebreaker-lang');
    return (saved === 'en' ? 'en' : 'zh');
  });

  useEffect(() => {
    localStorage.setItem('icebreaker-lang', lang);
  }, [lang]);

  const t = useCallback((key: string): string => {
    return dict[key]?.[lang] || key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
