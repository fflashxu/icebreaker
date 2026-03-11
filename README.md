<div align="center">

# 🧊 Icebreaker

**AI 招聘邮件生成器 — 让候选人感受到被认真对待**

*AI-powered recruiting email writer that feels personal, not templated*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-icebreaker.build-blue?style=for-the-badge)](https://icebreaker.build)
[![GitHub Stars](https://img.shields.io/github/stars/hxu911-bot/icebreaker?style=for-the-badge&logo=github&color=gold)](https://github.com/hxu911-bot/icebreaker/stargazers)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

[中文](#-你有没有遇到过这种情况) · [English](#-the-problem-with-template-emails)

</div>

---

<div align="center">

[![Demo Video](https://img.youtube.com/vi/zP75B1kEndA/maxresdefault.jpg)](https://youtu.be/zP75B1kEndA)

*▶ Watch the 60-second demo*

</div>

---

## 😩 The Problem with Template Emails

You're reaching out to dozens of candidates every day — but you're sending the same copy-pasted template to all of them. Candidates see right through it. Reply rates are dismal. You want to write something personal, but who has time to research every single resume?

**See the difference:**

<table>
<tr>
<td width="50%" align="center">

❌ **Generic template**

</td>
<td width="50%" align="center">

✅ **Icebreaker output**

</td>
</tr>
<tr>
<td width="50%">

> Hi, we have an exciting Senior Engineer opportunity at our company with competitive compensation. Please let me know if you'd like to learn more.

</td>
<td width="50%">

> *"I saw the distributed cache project you did at ByteDance — cutting P99 latency from 80ms down to 12ms. I forwarded it straight to our CTO. He told me to reach out to you first…"*

</td>
</tr>
</table>

Same candidate. Which email do you reply to?

**Icebreaker reads the resume, finds the most compelling detail, and writes an opening that feels like it was written just for that person.**

---

## 🌐 Live Demo

No setup needed — try it at **[icebreaker.build](https://icebreaker.build)**

> You'll need a DashScope API Key (free tier available). Your key is stored only in your own account — it never touches our servers.

---

## ✨ Real-World Scenarios

<table>
<tr>
<td width="50%">

**Tech HR reaching out to a senior engineer**

Candidate background:
> Ex-ByteDance infra engineer. Led a distributed cache optimization handling 10B daily requests. 2k-star open source project.

Generated opening:
> *"I saw the distributed cache project you did at ByteDance — cutting P99 latency from 80ms down to 12ms. I forwarded it straight to our CTO. He told me to reach out to you first…"*

</td>
<td width="50%">

**Employee referral reaching out to a former colleague**

Candidate background:
> Former colleague, worked on growth together, then moved to Shopee to lead SEA markets.

Generated opening:
> *"Your SEA experience at Shopee immediately made me think of the Southeast Asia push we're running right now. Honestly, you were the first person who came to mind — two years of lessons learned in that market is exactly what we need…"*

</td>
</tr>
<tr>
<td width="50%">

**Headhunter approaching a passive candidate**

Candidate background:
> Serial entrepreneur, two 0→1 ventures, currently at a unicorn.

Generated opening:
> *"You've built from zero twice — that's rare among professional managers. Our CEO is a serial founder himself. He says he doesn't want 'managers', he wants 'builders'. You're the latter…"*

</td>
<td width="50%">

**Cross-language outreach to an overseas candidate**

Candidate background:
> Chinese engineer based in Japan, published AI research papers.

Generated opening (Japanese):
> *「先日、先生の自然言語処理に関する論文を拝読いたしました。特に第三章のアテンション機構の改善手法は、私どもが直面している課題と完全に一致しており……」*

</td>
</tr>
</table>

---

## 🚀 Three Steps, 30 Seconds

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Step 1              Step 2              Step 3           │
│                                                             │
│  📄 Candidate info →  ⚙️ Email settings → ✉️ Results       │
│                                                             │
│  · Upload resume      · Sender profile    · Edit inline    │
│    PDF/Word/image     · Writing style     · One-click copy │
│  · Or paste text      · Language          · Translate      │
│                       · 1–3 emails                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 🧠 **Deep personalization** | References specific projects, achievements, and skills from the resume — no filler |
| 📎 **Resume parsing** | Upload PDF, Word, or screenshots; OCR extracts text automatically |
| 🎨 **4 writing styles** | Professional · Warm · Concise · Storytelling — match the role and culture |
| 🌍 **6 languages** | Chinese, English, Japanese, Korean, French, Spanish |
| 👤 **Multiple sender profiles** | Save HR / interviewer / executive / referral identities, switch instantly |
| ⚡ **Parallel generation** | Generate 1–3 emails at once, each with a different angle, no queue |
| 🔄 **Translate anytime** | Translate any generated email to any language, one at a time or all at once |
| ✏️ **Inline editing** | Edit the result directly, copy when ready |

---

## 🛠 Self-Hosting

### Prerequisites

- Node.js 18+
- PostgreSQL
- [DashScope API Key](https://dashscope.console.aliyun.com/) (free tier available for new users)

### Quickstart

```bash
# 1. Clone
git clone https://github.com/hxu911-bot/icebreaker.git
cd icebreaker

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Start backend (terminal 1)
cd backend && npm install && npm run dev   # → http://localhost:3100

# 4. Start frontend (terminal 2)
cd frontend && npm install && npm run dev  # → http://localhost:5200
```

Open **http://localhost:5200** and you're good to go.

---

## 🧱 Tech Stack

```
Frontend          Backend           AI
─────────         ─────────         ────────────────────────
React 18          Express           Qwen Plus (email generation)
Vite              TypeScript        Qwen VL Plus (image OCR)
Tailwind CSS      Prisma            via DashScope API
Zustand           PostgreSQL
React Query       JWT Auth
```

---

## 📁 Project Structure

```
icebreaker/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/         # JWT auth + invite-code registration
│       │   ├── profiles/     # Sender profile management
│       │   ├── parse/        # File parsing (PDF / DOCX / OCR)
│       │   ├── generate/     # AI email generation & translation
│       │   └── admin/        # Admin stats
│       └── middleware/       # Auth & error handling
└── frontend/
    └── src/
        ├── components/
        │   ├── wizard/       # 3-step wizard
        │   ├── profile/      # Profile management
        │   └── email/        # Email cards
        └── store/            # Zustand state
```

---
---

## 😩 你有没有遇到过这种情况

每天要联系几十个候选人，却不得不一遍遍发着同样的模板邮件。
候选人一眼看出这是群发，回复率低得可怜。
想写有温度的邮件，但哪有时间逐一研究每份简历？

**对比一下，感受很直观——**

<table>
<tr>
<td width="50%" align="center">

❌ **普通模板邮件**

</td>
<td width="50%" align="center">

✅ **Icebreaker 生成的邮件**

</td>
</tr>
<tr>
<td width="50%">

> 您好，我司正在招聘高级工程师岗位，薪资极具竞争力，欢迎了解详情，期待您的回复。

</td>
<td width="50%">

> *"看到你在字节做的分布式缓存那个项目，把 P99 延迟从 80ms 压到 12ms，我直接把这个发给了我们的 CTO。他让我第一时间联系你……"*

</td>
</tr>
</table>

同样一个候选人，哪封邮件你会回？

**Icebreaker 读懂候选人的简历，自动提炼具体细节，帮你写出一封像是专门为这个人写的邮件。**

---

## 🌐 立即体验

无需部署，直接访问：**[icebreaker.build](https://icebreaker.build)**

> 需要填入自己的 DashScope Key（免费注册即有额度，Key 仅存在你自己的账号下，不经过我们服务器）

---

## ✨ 真实场景

<table>
<tr>
<td width="50%">

**技术 HR 联系资深工程师**

候选人背景：
> 前字节跳动基础架构工程师，主导过日均百亿请求的分布式缓存优化，开源项目 2k star

生成邮件开头：
> *"看到你在字节做的分布式缓存那个项目，把 P99 延迟从 80ms 压到 12ms，我直接把这个发给了我们的 CTO。他让我第一时间联系你……"*

</td>
<td width="50%">

**内推人联系前同事**

候选人背景：
> 前同事，在上家公司一起做过增长，后来去了 Shopee 做 SEA 市场

生成邮件开头：
> *"你在 Shopee 负责 SEA 这段经历让我想到了我们现在正在推的东南亚业务……说实话我第一反应就是想到你，因为你在那边两年踩过的坑，正是我们现在最需要的……"*

</td>
</tr>
<tr>
<td width="50%">

**猎头联系被动候选人**

候选人背景：
> 连续创业者，两次创业经历，擅长 0→1，目前在某独角兽任职

生成邮件开头：
> *"你有两次从零做到一的经历，这在职业经理人里很少见。我们 CEO 本人也是连续创业者，他说他不要'管理者'，他要'建造者'。你是后者……"*

</td>
<td width="50%">

**跨语言联系海外候选人**

候选人背景：
> 在日本工作的华人工程师，有 AI 相关论文发表

生成邮件开头（日语）：
> *「先日、先生の自然言語処理に関する論文を拝読いたしました。特に第三章のアテンション機構の改善手法は、私どもが直面している課題と完全に一致しており……」*

</td>
</tr>
</table>

---

## 🚀 三步完成，30 秒出邮件

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Step 1              Step 2              Step 3           │
│                                                             │
│  📄 候选人信息  →   ⚙️ 邮件设置   →   ✉️ 生成结果          │
│                                                             │
│  · 上传简历           · 选发件人            · 在线编辑       │
│    PDF/Word/图片       · 选风格             · 一键复制       │
│  · 或粘贴文字         · 选语言             · 翻译全文       │
│                       · 生成 1~3 封                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| 🧠 **AI 深度个性化** | 自动识别并引用候选人简历中的具体项目、成就、技能，不写废话 |
| 📎 **简历一键解析** | 上传 PDF、Word、截图均可，OCR 自动提取文字 |
| 🎨 **4 种邮件风格** | 专业正式 / 温暖亲切 / 简洁直接 / 讲故事，匹配不同岗位文化 |
| 🌍 **6 种语言** | 中文、English、日本語、한국어、Français、Español |
| 👤 **多身份管理** | 保存 HR / 面试官 / 高管 / 内推人等多个发件人身份，随时切换 |
| ⚡ **并行生成** | 一次生成 1~3 封，每封角度不同，并行执行不排队 |
| 🔄 **随时翻译** | 生成后随时翻译到任意语言，单封或批量 |
| ✏️ **在线编辑** | 生成结果可直接修改，满意后一键复制 |

---

## 🛠 本地部署

### 前置条件

- Node.js 18+
- PostgreSQL
- [DashScope API Key](https://dashscope.console.aliyun.com/)（新用户有免费额度）

### 启动

```bash
# 1. 克隆项目
git clone https://github.com/hxu911-bot/icebreaker.git
cd icebreaker

# 2. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 DATABASE_URL、JWT_SECRET、ADMIN_EMAIL、ADMIN_PASSWORD

# 3. 启动后端（终端 1）
cd backend && npm install && npm run dev   # → http://localhost:3100

# 4. 启动前端（终端 2）
cd frontend && npm install && npm run dev  # → http://localhost:5200
```

打开 **http://localhost:5200** 即可使用。

---

## 🧱 技术栈

```
Frontend          Backend           AI
─────────         ─────────         ────────────────────────
React 18          Express           Qwen Plus（邮件生成）
Vite              TypeScript        Qwen VL Plus（图片 OCR）
Tailwind CSS      Prisma            via DashScope API
Zustand           PostgreSQL
React Query       JWT Auth
```

---

## 📁 项目结构

```
icebreaker/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/         # 用户认证（JWT + 邀请码）
│       │   ├── profiles/     # 发件人 Profile 管理
│       │   ├── parse/        # 文件解析（PDF / DOCX / OCR）
│       │   ├── generate/     # AI 邮件生成 & 翻译
│       │   └── admin/        # 管理员统计
│       └── middleware/       # 认证 & 错误处理
└── frontend/
    └── src/
        ├── components/
        │   ├── wizard/       # 三步向导
        │   ├── profile/      # Profile 管理
        │   └── email/        # 邮件卡片
        └── store/            # Zustand 状态
```

---

<div align="center">

If this helped you, a Star ⭐ means a lot — thank you!

觉得有用的话，点个 Star ⭐ 是对我最大的鼓励

[![Star History Chart](https://api.star-history.com/svg?repos=hxu911-bot/icebreaker&type=Date)](https://star-history.com/#hxu911-bot/icebreaker&Date)

</div>
