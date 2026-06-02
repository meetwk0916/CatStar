这份文档专为 AI 提示词工程（Prompt Engineering）与 AI 编程助手（Codex / Cursor / Claude）进行了深度优化。文档采用**高内聚、模块化、强逻辑约束**的结构编写，并完全基于 **“纯 React+Tailwind 开发 Web 版（留好微信小程序后路）”** 以及 **“99封信留白美学”** 的技术路径设计。

你可以直接将以下内容整篇复制为一个 `.md` 文件，投喂给你的 AI 编码助手，它将能够直接理解并开始输出完美对齐的代码。

---

# 《喵星来信》(Letters from Cat Star) Phase 0 核心开发说明书

## 适用对象：Codex / Cursor / Claude Agent (Web-First to Mini-Program Ready)

### 🤖 编程助手前置指令 (AI Persona)

你是一个精通 React、TypeScript 和 Tailwind CSS 的独立全栈开发专家。你的任务是编写《喵星来信》的 Phase 0 阶段（纯客户端网页 GUI 演示版）。
**架构核心约束**：代码必须高度模块化，**将业务逻辑（状态机、时间计算）与 UI 渲染（DOM 标签）彻底解耦**，所有样式必须使用标准的 Tailwind 类，以便后续无缝强转微信小程序（将 `div` 翻译为 `view`）。
**资源红线**：不依赖任何外部图片、字体或音频资产，全站视觉由纯代码像素矩阵和 CSS 绘就。允许使用 npm 动画库（如 Framer Motion）作为交互动画基础设施，但不得引入外部视觉素材。

**领域边界**：Phase 0 只支持已经离世的真实小猫，不抽象为通用宠物产品，也不引入 `petType` 或狗/其他动物分支。

**数据边界**：Phase 0 只保存本地纪念数据，不做账号、不上传云端、不跨设备同步。用户界面应诚实提示当前护照和信件阅读记录只保存在当前设备。

**文案边界**：信件和陪伴反应应使用轻柔祝愿，不命令用户“别难过”“快点走出来”或“一定要快乐”。允许承认想念和悲伤仍然存在。

**工程分层约束**：UI 组件不得直接散落调用 `localStorage`、`Date.now()` 或随机状态权重计算。请将这些能力封装到独立模块：

* `storage/passportStorage.ts`：护照读写、清除、序列化。
* `domain/time.ts`：当前时间、小时差计算。
* `domain/letters.ts`：每日投递、模板替换、已读状态。
* `domain/catFsm.ts`：性格权重、随机状态选择、互动状态切换。
* `types.ts`：全局类型定义。

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
  ownerName: string;        // 家人称呼：信里小猫用来称呼用户的名字或昵称
  colorPalette: CatPalette;
  personality: CatPersonality;
  favoriteSnack: string;
  passedDate: string;
  createdAt: number;         // 护照创建的绝对时间戳 (Date.now())
  readLetters: number[];     // 已读信件的 ID 数组 (e.g., [1, 2])
  isFarewellCompleted: boolean; // 是否已完成最终信末尾的告别选择
}

// 有限状态机状态
export type CatFsmState = 'IDLE' | 'WALKING' | 'JUMPING' | 'EATING' | 'SLEEPING' | 'INTERACTING';

// 剧本信件结构
export interface ILetter {
  id: number;                     // 1 到 99
  deliveryIndex: number;          // 投递序号：0 立即投递；1 创建后次日 8 点；2 再下一天 8 点
  title: string;
  templateContent: string;        // 包含占位符的文本
}

```

---

## 二、 核心功能模块规范

### 2.1 护照登记模块 (Onboarding Form)

* **功能描述**：收集小猫信息，转化为 `ICatPassport` 对象并存入本地。
* **表单文案约束**：`ownerName` 字段在用户界面中应表达为“你希望小猫怎么称呼你？”或“家人称呼”，不得写成“主人姓名”。
* **最小收集约束**：Phase 0 只收集护照所需字段：猫名、家人称呼、毛色、性格、喜欢的零食、离世日期。不收集具体回忆、私人故事或长文本纪念素材。
* **纪念特征约束**：毛色、性格等选择项应表达为小猫真实的纪念特征，不得写成“皮肤”“属性”“角色参数”等游戏化语言。它们可以影响像素猫外观和陪伴表现，但产品语义仍是纪念。
* **本地数据轻提示**：登记页底部或设置中应温和提示：“当前版本会把小猫护照和信件阅读记录保存在这台设备上。” 不使用“免责声明”“责任免除”等冷硬表达。
* **视觉规范**：
* 整体色调采用温暖的纸张底色：`bg-[#FBF8F3]`，主文字采用有温度的深褐墨色：`text-[#4A3E3D]`。
* 所有边框及按钮必须使用硬朗的复古像素风：`border-4 border-[#4A3E3D] shadow-[4px_4px_0px_0px_#4A3E3D]`。


* **后路解耦**：将存储动作封装为独立的函数（如 `savePassport(data)`），后续转小程序时只需将 `localStorage.setItem` 替换为 `wx.setStorageSync`。
* **重新登记约束**：允许在设置或开发入口中清除当前护照并重新登记，但用户界面必须称为“重新登记”，不得写成“删除小猫”“重置游戏”“清档”。执行前必须提示会清除当前护照和信件阅读记录。

### 2.2 璀璨星空岛与有限状态机 (FSM Scene)

小猫的行为由一个确定性的 React `useEffect` 定时器驱动（每 6000ms 触发一次 Tick）。

#### 1. 状态权重及性格修正算法

每次 Tick 触发时，根据小猫的 `personality` 重新计算切换到下一个状态的概率区间：

* **默认权重基准（总和 100）**：`IDLE: 30, WALKING: 30, JUMPING: 10, EATING: 10, SLEEPING: 20`
* **`ALOOFS` (高冷大佬)**：`SLEEPING: 50, IDLE: 30, WALKING: 10, JUMPING: 5, EATING: 5`
* **`GLUTTON` (干饭王)**：`EATING: 40, WALKING: 20, IDLE: 20, SLEEPING: 10, JUMPING: 10`
* **`ENERGY` (拆家狂)**：`WALKING: 40, JUMPING: 35, IDLE: 10, SLEEPING: 10, EATING: 5`
* **`CLINGY` (黏人小尾巴)**：`IDLE: 35, WALKING: 25, JUMPING: 20, EATING: 10, SLEEPING: 10`

当 `passport.isFarewellCompleted === true` 时，信件叙事进入终局，但小猫的普通陪伴表现继续保留。不得因为告别完成而禁用 `EATING`、`SLEEPING` 等日常动作。

#### 2. 位移与边界动画 (Framer Motion 实现)

* 定义星空岛活动区域为相对定位容器（推荐宽 320px，高 160px）。
* 切换到 `WALKING` 时，随机生成区域内目标坐标 $(newX, newY)$。使用 Framer Motion 让小猫容器平滑位移（`duration: 3, ease: "easeInOut"`）。若 $newX > currentX$，设置 `scaleX: 1`（面向右），反之 `scaleX: -1`（面向左）。
* 切换到 `JUMPING` 时，在位移过程中，对子组件的 `y` 轴叠加关键帧动画：`y: [0, -30, 0]`，模拟抛物线重力跳跃。
* **用户点击（INTERACTING）**：点击小猫立刻强行打断当前状态，清除定时器，状态变为 `INTERACTING`。小猫原地触发弹性高频抖动，弹出短促陪伴反应气泡。气泡只表达在场感，不承载新剧情、不发明具体回忆、不形成聊天系统。3秒后，重新拉起 FSM 定时器。

### 2.3 时光信箱与 99 封信的遗憾美学 (Mailbox System)

#### 1. 每日 8 点投递计算

信件不是实时 AI 生成内容，而是预写剧本信。第一封信在护照创建后立即投递，作为登记完成后的温柔回应。第二封及后续信件，从护照创建后的下一个自然日早上 8:00 开始投递，此后以用户设备本地时间的每天早上 8:00 作为投递锚点。

设 `nextMorningDeliveryAt` 为护照创建后的下一个自然日 8:00，用于第二封及后续信件。

示例：如果用户在周一 7:50 创建护照，第一封立即投递；第二封在周二 8:00 投递，不在周一 8:00 追加投递。

投递判断：

* `letter.deliveryIndex === 0`：创建护照后立即投递。
* `letter.deliveryIndex >= 1`：从 `nextMorningDeliveryAt` 开始按天投递。

如果 `Date.now() < nextMorningDeliveryAt`，除第一封外尚无后续信件投递。

否则：

$$\Delta t_{\text{morningDeliveryDays}} = 1 + \left\lfloor \frac{\text{Date.now}() - \text{nextMorningDeliveryAt}}{86400000} \right\rfloor$$

如果 $\Delta t_{\text{morningDeliveryDays}} \ge \text{letter.deliveryIndex}$，则该预写信件被投递到时光信箱，变为可阅读状态。投递不等于已读。

投递按日期累计，不依赖用户是否打开 App。如果用户连续几天未进入时光信箱，下次打开时应根据当前时间一次性展示所有已经到达的信件。

信件投递资格和列表排序以 `deliveryIndex` 为主，同一个 `deliveryIndex` 内按 `id` 升序排列。`id === 99` 的最终信额外受到“所有其他信件已读”限制。

信箱入口只显示未读数字，不使用强刺激红点、任务徽章、催促性文案或“有 N 封新信到了”等额外提示。

信箱列表只展示已投递信件。未投递信件不显示占位、不展示 99 个空位，也不提前暴露最终信。可以在列表底部显示一句轻提示，例如“下一封还在来喵星的路上”。

#### 2. 第 99 封信的终点判定逻辑

* 正式信件剧本库目标为 1 至 99 封。Phase 0 只内置 3 封测试信（`1`、`2`、`99`），但数据结构、投递逻辑、已读逻辑必须按 99 封扩展设计。
* Phase 0 为方便测试，允许第 99 封使用 `deliveryIndex: 7`。正式 99 封剧本库中，由于第 1 封为 `deliveryIndex: 0`，第 99 封应为 `deliveryIndex: 98`。
* 普通信件在投递到信箱后可以任意顺序阅读。
* `id === 99` 是最终信。最终信即使已经投递，也必须等所有其他信件已读后才允许打开。
* 最终信在已投递但未满足阅读条件前，可以出现在信箱列表中，但不可打开，且不暴露完整标题“最后一封信：星河远航”。可显示为“远方的星光”，副文案可写“还有几封旧信在等你”。等其他信件都已读后，再显示完整标题并允许打开。
* 普通信件打开即记为已读，不需要额外点击“确认读完”。
* 最终信打开后可先记为已读，但不立即进入星河陪伴。最终信正文末尾应出现一个有仪式感的告别选择，例如“谢谢你陪我走到这里”。用户完成该选择后，更新持久化状态：`passport.isFarewellCompleted = true`，并进入信箱封存态。
* 如果用户打开最终信但未完成告别选择就关闭，最终信可以保持已读，但信箱不进入封存态。下次打开最终信时仍应显示告别选择。
* **触发视觉质变（星河陪伴）**：
1. **信箱封存**：当当前剧本库中的所有信件都已读完，且用户完成最终信末尾的告别选择后，时光信箱不再投递新的信件，但用户仍可打开信箱回看已经读过的信。信箱入口样式可转为星河封存态；当用户期待新的信件时，提示：“*这是小猫留下的最后一封信，信箱已化作璀璨星河。*”
2. **星尘标记**：在 `PixelCatRenderer` 像素渲染组件中，检测到 `isFarewellCompleted === true` 时，**自动在小猫身边或头顶附近渲染若干闪闪发光的金色星尘像素方块（推荐颜色 `#FFD700`）**。该视觉属于喵星世界观中的纪念标记，不使用“光环”“天使”“升天”等宗教化或升格化表达。小猫继续保留日常陪伴表现，象征信件告别完成后，它仍以温柔、平常的方式待在喵星。



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

## 四、 Phase 0 核心剧本测试集 (`letters.json`)

请使用标准正则表达式全局替换正文中的 `{catName}`、`{ownerName}`、`{favoriteSnack}`。

```json
[
  {
    "id": 1,
    "deliveryIndex": 0,
    "title": "已安全到达喵星 ✨",
    "templateContent": "亲爱的{ownerName}，我已经安全到达赛博喵星啦。这里有一整片软绵绵的云朵草坪。告诉你个小秘密，我的身体一点都不痛了，轻飘飘的，刚落地我就开心地试了一下蹦跳呢。不用担心我哦，你也要乖乖按时吃饭呀。"
  },
  {
    "id": 2,
    "deliveryIndex": 1,
    "title": "新家发现好吃的了 🐟",
    "templateContent": "{ownerName}，今天我分配到了自己在喵星的专属小窝，背景里全是亮晶晶的星星。更棒的是，这里的猫碗里永远装满了热腾腾的{favoriteSnack}！每吃一口，我都会想起以前你开罐头时，我在你脚边绕圈圈的日子。我今天吃得很饱，准备去睡个午觉啦。"
  },
  {
    "id": 99,
    "deliveryIndex": 7,
    "title": "最后一封信：星河远航 ⛵",
    "templateContent": "对不起呀{ownerName}，这是我写给你的第99封信了。喵星的远航船要开了，我们要去探索更深的星系，以后可能没办法经常给你写信啦。外面的世界很大，但我最爱的，永远是地球上那个小小的家。谢谢你陪我长大。以后如果你还是会想我，也没有关系；我会把星星留在这里，陪你慢慢往前走。再见啦，我最爱的人。"
  }
]

```

---

## 五、 Codex 步骤化启动指南

1. **Step 1**: 在前端根目录下创建并初始化状态管理。检测 `localStorage` 中是否存在护照数据，若无，强制渲染 `OnboardingForm` 登记页。
2. **Step 2**: 编写 `PixelCatRenderer` 组件。使用标准的 `svg` 渲染 `FRAME_IDLE` 矩阵。并使用 CSS 属性 `image-rendering: pixelated;` 保证像素边界的绝对锐利。
3. **Step 3**: 编写主场景状态机计时器。实现小猫的随机状态切换，并确保 WXSS/Tailwind 风格的平滑过渡动画。
4. **Step 4**: 实现时光信箱的弹窗。注入每日 8 点投递计算，展示已投递信件；未投递信件不显示精确倒计时，只用温和文案提示它还在来喵星的路上。

*请立刻按照上述要求开始 Step 1 的代码编写，确保逻辑清晰、界面温暖。*
