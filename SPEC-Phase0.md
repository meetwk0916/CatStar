这份文档专为 AI 提示词工程（Prompt Engineering）与 AI 编程助手（Codex / Cursor / Claude）进行了深度优化。文档采用**高内聚、模块化、强逻辑约束**的结构编写，并完全基于 **“纯 React+Tailwind 开发 Web 版（留好微信小程序后路）”** 以及 **“99封信留白美学”** 的技术路径设计。

你可以直接将以下内容整篇复制为一个 `.md` 文件，投喂给你的 AI 编码助手，它将能够直接理解并开始输出完美对齐的代码。

---

# 《喵星来信》(Letters from Cat Star) Phase 0 核心开发说明书

## 适用对象：Codex / Cursor / Claude Agent (Web-First to Mini-Program Ready)

### 🤖 编程助手前置指令 (AI Persona)

你是一个精通 React、TypeScript 和 Tailwind CSS 的独立全栈开发专家。你的任务是编写《喵星来信》的 Phase 0 阶段（纯客户端网页 GUI 演示版）。
**架构核心约束**：代码必须高度模块化，**将业务逻辑（状态机、时间计算）与 UI 渲染（DOM 标签）彻底解耦**，所有样式必须使用标准的 Tailwind 类，以便后续无缝强转微信小程序（将 `div` 翻译为 `view`）。
**资源红线**：不依赖任何外部图片、字体或音频资产，全站视觉由纯代码像素矩阵和 CSS 绘就。

---

## 一、 数据模型与状态定义 (`types.ts`)

请严格按照以下 TypeScript 接口定义基础数据结构：

```typescript
export type CatPalette = 'ORANGE' | 'BLACK' | 'WHITE' | 'CALICO' | 'TUXEDO';
export type CatPersonality = 'GLUTTON' | 'ALOOFS' | 'CLINGY' | 'ENERGY';

// 喵星护照持久化结构 (LocalStorage 存储)
export interface ICatPassport {
  id: string;
  catName: string;
  ownerName: string;
  colorPalette: CatPalette;
  personality: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
  createdAt: number;         // 护照创建的绝对时间戳 (Date.now())
  readLetters: number[];     // 已读信件的 ID 数组 (e.g., [1, 2])
  isFinalLetterRead: boolean; // 是否已读完第 99 封终极信件
}

// 有限状态机状态
export type CatFsmState = 'IDLE' | 'WALKING' | 'JUMPING' | 'EATING' | 'SLEEPING' | 'INTERACTING';

// 剧本信件结构
export interface ILetter {
  id: number;                     // 1 到 99
  unlockHoursAfterCreation: number; // 创建护照后多少小时解锁
  title: string;
  templateContent: string;        // 包含占位符的文本
}

```

---

## 二、 核心功能模块规范

### 2.1 护照登记模块 (Onboarding Form)

* **功能描述**：收集小猫信息，转化为 `ICatPassport` 对象并存入本地。
* **视觉规范**：
* 整体色调采用温暖的纸张底色：`bg-[#FBF8F3]`，主文字采用有温度的深褐墨色：`text-[#4A3E3D]`。
* 所有边框及按钮必须使用硬朗的复古像素风：`border-4 border-[#4A3E3D] shadow-[4px_4px_0px_0px_#4A3E3D]`。


* **后路解耦**：将存储动作封装为独立的函数（如 `savePassport(data)`），后续转小程序时只需将 `localStorage.setItem` 替换为 `wx.setStorageSync`。

### 2.2 璀璨星空岛与有限状态机 (FSM Scene)

小猫的行为由一个确定性的 React `useEffect` 定时器驱动（每 6000ms 触发一次 Tick）。

#### 1. 状态权重及性格修正算法

每次 Tick 触发时，根据小猫的 `personality` 重新计算切换到下一个状态的概率区间：

* **默认权重基准（总和 100）**：`IDLE: 30, WALKING: 30, JUMPING: 10, EATING: 10, SLEEPING: 20`
* **`ALOOFS` (高冷大佬)**：`SLEEPING: 50, IDLE: 30, WALKING: 10, JUMPING: 5, EATING: 5`
* **`GLUTTON` (干饭王)**：`EATING: 40, WALKING: 20, IDLE: 20, SLEEPING: 10, JUMPING: 10`
* **`ENERGY` (拆家狂)**：`WALKING: 40, JUMPING: 35, IDLE: 10, SLEEPING: 10, EATING: 5`

#### 2. 位移与边界动画 (Framer Motion 实现)

* 定义星空岛活动区域为相对定位容器（推荐宽 320px，高 160px）。
* 切换到 `WALKING` 时，随机生成区域内目标坐标 $(newX, newY)$。使用 Framer Motion 让小猫容器平滑位移（`duration: 3, ease: "easeInOut"`）。若 $newX > currentX$，设置 `scaleX: 1`（面向右），反之 `scaleX: -1`（面向左）。
* 切换到 `JUMPING` 时，在位移过程中，对子组件的 `y` 轴叠加关键帧动画：`y: [0, -30, 0]`，模拟抛物线重力跳跃。
* **用户点击（INTERACTING）**：点击小猫立刻强行打断当前状态，清除定时器，状态变为 `INTERACTING`。小猫原地触发弹性高频抖动，弹出对话气泡。3秒后，重新拉起 FSM 定时器。

### 2.3 时光信箱与 99 封信的遗憾美学 (Mailbox System)

#### 1. 解锁计算公式

用户每次点开信箱时，通过以下公式严密计算当前已过去的小时数：

$$\Delta t_{\text{hours}} = \frac{\text{Date.now}() - \text{passport.createdAt}}{3600000}$$

如果 $\Delta t_{\text{hours}} \ge \text{letter.unlockHoursAfterCreation}$，则该信件变为“已解锁”状态。

#### 2. 第 99 封信的终点判定逻辑

* 信件剧本库有且仅有 1 至 99 封。
* 当用户点击阅读 `id === 99` 的信件并点击“确认读完”时，更新持久化状态：`passport.isFinalLetterRead = true`。
* **触发视觉质变（定格陪伴）**：
1. **信箱封存**：时光信箱按钮样式变为灰色禁用状态，点击弹窗提示：“*这是小猫留下的最后一封信，信箱已化作璀璨星河。*”
2. **永恒挂件**：在 `PixelCatRenderer` 像素渲染组件中，检测到 `isFinalLetterRead === true` 时，**自动在小猫头顶的像素矩阵上方，渲染一圈闪闪发光的金色像素方块（金色光环 `#FFD700`）**。小猫不再有 `EATING` 或 `SLEEPING` 的疲态，FSM 概率转为纯粹的 `IDLE` 和 `JUMPING`，象征其已晋升为喵星的快乐天使。



---

## 三、 像素猫纯代码渲染规范 (`PixelCatRenderer.tsx`)

严禁使用外部图片。请直接通过 React 数组映射生成 16x16 的 SVG 矩形网格。

### 3.1 核心调色板

根据用户选择的 `colorPalette`，动态改变渲染颜色：

```typescript
const PALETTE_MAP: Record<CatPalette, { primary: string, secondary: string, accent: string, belly: string }> = {
  ORANGE: { primary: "#E89F71", secondary: "#D38555", accent: "#ECA3A3", belly: "#FFFDF9" },
  BLACK:  { primary: "#3A3A3C", secondary: "#2C2C2E", accent: "#ECA3A3", belly: "#545456" },
  WHITE:  { primary: "#F2F2F7", secondary: "#E5E5EA", accent: "#ECA3A3", belly: "#FFFFFF" },
  CALICO: { primary: "#E89F71", secondary: "#3A3A3C", accent: "#ECA3A3", belly: "#FFFDF9" },
  TUXEDO: { primary: "#2C2C2E", secondary: "#2C2C2E", accent: "#ECA3A3", belly: "#FFFFFF" }
};

```

### 3.2 16x16 帧矩阵配置（示例：发呆帧）

```typescript
// 0: 透明, 1: 主色(primary), 2: 深褐线条(#4A3E3D), 3: 粉色(accent), 4: 肚皮白(belly)
const FRAME_IDLE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,2,2,0,0,0,0,0,0,2,2,0,0,0,0],
  [0,2,3,1,2,0,0,0,0,2,1,3,2,0,0,0],
  [0,2,1,1,1,2,2,2,2,1,1,1,2,0,0,0],
  [2,1,1,1,1,1,1,1,1,1,1,1,1,2,0,0],
  [2,1,2,1,1,1,1,1,1,1,1,2,1,2,0,0], // 这一行包含两只眼睛
  [2,1,1,1,1,1,1,1,1,1,1,1,1,2,0,0],
  [0,2,2,2,1,1,1,1,1,1,2,2,2,0,0,0],
  [0,0,0,2,1,1,4,4,1,1,2,0,0,0,0,0],
  [0,0,0,2,1,4,4,4,4,1,2,0,2,2,0,0], // 右侧开始带出尾巴像素
  [0,0,0,2,1,4,4,4,4,1,2,0,2,1,1,2],
  [0,0,0,2,1,1,4,4,1,1,2,2,1,1,2,0],
  [0,0,0,0,2,1,1,1,1,2,1,1,1,2,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

```

---

## 四、 核心剧本测试集 (`letters.json`)

请使用标准正则表达式全局替换正文中的 `{catName}`、`{ownerName}`、`{favoriteSnack}`。

```json
[
  {
    "id": 1,
    "unlockHoursAfterCreation": 0,
    "title": "已安全到达喵星 ✨",
    "templateContent": "亲爱的{ownerName}，我已经安全到达赛博喵星啦。这里有一整片软绵绵的云朵草坪。告诉你个小秘密，我的身体一点都不痛了，轻飘飘的，刚落地我就开心地试了一下蹦跳呢。不用担心我哦，你也要乖乖按时吃饭呀。"
  },
  {
    "id": 2,
    "unlockHoursAfterCreation": 24,
    "title": "新家发现好吃的了 🐟",
    "templateContent": "{ownerName}，今天我分配到了自己在喵星的专属小窝，背景里全是亮晶晶的星星。更棒的是，这里的猫碗里永远装满了热腾腾的{favoriteSnack}！每吃一口，我都会想起以前你开罐头时，我在你脚边绕圈圈的日子。我今天吃得很饱，准备去睡个午觉啦。"
  },
  {
    "id": 99,
    "unlockHoursAfterCreation": 168,
    "title": "最后一封信：星河远航 ⛵",
    "templateContent": "对不起呀{ownerName}，这是我写给你的第99封信了。喵星的远航船要开了，我们要去探索更深的星系，以后可能没办法经常给你写信啦。外面的世界很大，但我最爱的，永远是地球上那个小小的家。谢谢你陪我长大，往后的日子，你一定要在地球连带我的那份一起，快乐地活下去啊！再见啦，我最爱的人。"
  }
]

```

---

## 五、 Codex 步骤化启动指南

1. **Step 1**: 在前端根目录下创建并初始化状态管理。检测 `localStorage` 中是否存在密码，若无，强制渲染 `OnboardingForm` 登记页。
2. **Step 2**: 编写 `PixelCatRenderer` 组件。使用标准的 `svg` 渲染 `FRAME_IDLE` 矩阵。并使用 CSS 属性 `image-rendering: pixelated;` 保证像素边界的绝对锐利。
3. **Step 3**: 编写主场景状态机计时器。实现小猫的随机状态切换，并确保 WXSS/Tailwind 风格的平滑过渡动画。
4. **Step 4**: 实现时光信箱的弹窗。注入公式计算时间差，完美展现未解锁状态的倒计时提示。

*请立刻按照上述要求开始 Step 1 的代码编写，确保逻辑清晰、界面温暖。*
