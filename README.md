# 轮吹换气时点偏差训练

Breath Timing Accuracy Trainer - 纯浏览器端的管乐换气时机训练工具。

## 功能特点

- 🎵 播放参考乐段，附带换气时刻表
- ⌨️ 空格键标记换气时机
- 📊 实时偏差计算与评级（Perfect / Good / Miss）
- 🔥 Combo 连击机制（连续3次 Miss 断连击）
- 📈 各轮命中率统计与平均偏差
- 🏆 本地存储个人最佳成绩
- 🐳 Docker 容器化部署，无需后端

## 评分规则

| 评级 | 偏差范围 | 说明 |
|------|---------|------|
| Perfect | 0 - 45ms | 非常精准 |
| Good | 46 - 100ms | 良好 |
| Miss | > 100ms 或 未按键 | 偏差过大 |

- **Combo 机制**：每次 Perfect 或 Good 累计 Combo +1，连续 3 次 Miss 则 Combo 清零
- **命中率**：(Perfect 数 + Good 数) / 总换气点数量 × 100%
- **平均偏差**：所有命中时刻偏差的绝对值平均值

## 快速开始

### 开发模式

```bash
npm install
npm run dev
```

### 生产构建

```bash
npm run build
npm run preview
```

### Docker 部署

```bash
docker build -t breath-trainer .
docker run -p 8080:80 breath-trainer
```

访问 `http://localhost:8080` 即可使用。

## 替换自定义乐段

### 1. 准备音频文件

将你的乐段音频文件放入 `public/audio/` 目录，支持以下格式：
- WAV（推荐，音质好）
- MP3
- OGG

示例：`public/audio/my-music.wav`

### 2. 准备乐段数据

编辑 `src/data/sampleMusic.ts` 文件，替换为你的乐段数据：

```typescript
import type { MusicData } from '@/types';

export const sampleMusic: MusicData = {
  id: 'my-music-001',           // 乐段唯一标识
  name: '自定义练习曲',          // 乐段显示名称
  duration: 32000,               // 总时长（毫秒）
  audioUrl: '/audio/my-music.wav', // 音频文件路径
  totalRounds: 4,                 // 总轮数
  breathPoints: [                 // 换气时刻列表
    { time: 2000, round: 1 },     // time=毫秒偏移量, round=第几轮
    { time: 4500, round: 1 },
    { time: 7000, round: 1 },
    // ... 更多换气点
  ],
};
```

### 3. 换气时刻表说明

- **time**：从乐段开始到该换气点的毫秒数
- **round**：该换气点属于第几轮吹奏
- 换气点按时间顺序排列
- 系统会根据轮次分组统计命中率

### 4. 可选：生成带提示音的音频

如果需要在换气点有提示音，可以使用提供的音频生成脚本：

```bash
node scripts/generate-sample-audio.js
```

修改脚本中的 `breathPoints` 和 `duration` 变量来匹配你的乐段。

## 数据存储

个人最佳成绩存储在浏览器的 `localStorage` 中，按乐段 ID 分别记录。

清除记录：在浏览器开发者工具中执行 `localStorage.removeItem('breath-training-best-records')`

## 技术栈

- **前端**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式**：TailwindCSS 3
- **状态管理**：Zustand
- **图标**：Lucide React
- **音频**：HTML5 Audio API
- **部署**：Nginx + Docker

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── Header.tsx       # 顶部标题栏
│   ├── MusicInfo.tsx    # 乐段信息卡
│   ├── WaveformProgress.tsx  # 波形进度条
│   ├── RealtimeFeedback.tsx  # 实时反馈区
│   ├── StatsPanel.tsx   # 统计面板
│   ├── ControlButtons.tsx    # 控制按钮
│   ├── BreathSchedule.tsx    # 换气时刻表
│   └── Instructions.tsx # 操作说明
├── hooks/               # 自定义 Hooks
│   ├── useAudioPlayer.ts    # 音频播放
│   ├── useKeyPress.ts       # 按键监听
│   └── useTrainingLogic.ts  # 训练逻辑
├── store/               # 状态管理
│   └── useTrainingStore.ts
├── data/                # 乐段数据
│   └── sampleMusic.ts   # 示例乐段
├── types/               # 类型定义
│   └── index.ts
├── utils/               # 工具函数
│   ├── scoring.ts       # 评分计算
│   └── storage.ts       # 本地存储
├── pages/
│   └── Home.tsx         # 主页
├── App.tsx
├── main.tsx
└── index.css

public/
└── audio/               # 音频文件
    └── sample.wav       # 示例音频

scripts/
└── generate-sample-audio.js  # 音频生成脚本
```

## License

MIT
