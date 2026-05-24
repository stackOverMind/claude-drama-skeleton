# 生成执行

## 图片生成

### 基本命令

```bash
npx -y bun .claude/skills/content-gen/scripts/image/main.ts \
  --promptfiles <提示词文件.md> \
  --image <输出路径.png> \
  [选项]
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--prompt <text>`, `-p` | 直接传入 prompt 文本（与 --promptfiles 二选一） | - |
| `--promptfiles <files...>` | 从文件读取 prompt（多个文件会拼接） | - |
| `--image <path>` | 输出图片路径（**必须**） | - |
| `-m, --model <id>` | 模型 ID | 从 `.env` 读取 |
| `--ar <ratio>` | 宽高比：`16:9`、`1:1`、`4:3`、`9:16` | 1:1 |
| `--size <WxH>` | 自定义尺寸：`1024x1024` | - |
| `--quality normal\|2k` | 质量预设 | 2k |
| `--ref <files...>` | 参考图片路径（图生图） | - |
| `--n <count>` | 生成数量 | 1 |
| `--timeout <seconds>` | 超时时间 | 300 |
| `--json` | JSON 输出 | - |

### 默认分辨率

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `quality` | `2k` | 默认 2k 质量，baseSize = 2048 |
| `size`（1:1） | `2048x2048` | 不指定宽高比时的默认尺寸 |
| `size`（16:9） | `3648x2048` | 按宽高比计算的 2048 基准高度 |
| `size`（9:16） | `2048x3648` | 按宽高比计算的 2048 基准宽度 |

**规则**：
- 生图默认使用 `2k` 质量，除非用户显式指定 `--quality normal`（此时 baseSize = 1024）
- 不指定 `--ar` 或 `--size` 时，输出为 `2048x2048`
- 指定 `--ar` 时，以 2048 为基准边长按宽高比计算另一边长，并向上取整到 16 的倍数

### 按任务类型的命令示例

#### 角色生成（文生图）

```bash
npx -y bun .claude/skills/content-gen/scripts/image/main.ts \
  --promptfiles 项目-视频-日漫女孩/2-素材/角色/Yi/人物参考-Yi-运动服.md \
  --image 项目-视频-日漫女孩/2-素材/角色/Yi/人物参考-Yi-运动服.png \
  --ar 1:1 --quality 2k
```

#### 场景生成（文生图）

```bash
npx -y bun .claude/skills/content-gen/scripts/image/main.ts \
  --promptfiles 项目-视频-日漫女孩/2-素材/场景/日本街道/场景参考-日本街道-白天.md \
  --image 项目-视频-日漫女孩/2-素材/场景/日本街道/场景参考-日本街道-白天.png \
  --ar 1:1 --quality 2k
```

#### 关键帧生成（图生图）

```bash
npx -y bun .claude/skills/content-gen/scripts/image/main.ts \
  --promptfiles 项目-视频-日漫女孩/3-关键帧/关键帧-街头行走-v1.md \
  --image 项目-视频-日漫女孩/3-关键帧/关键帧-街头行走-v1.png \
  --ref 项目-视频-日漫女孩/2-素材/角色/Yi/人物参考-Yi-运动服.png \
  --ar 16:9 --quality 2k
```

#### 九宫格关键帧（图生图）

```bash
npx -y bun .claude/skills/content-gen/scripts/image/main.ts \
  --promptfiles 项目-视频-日漫女孩/3-关键帧/关键帧-Yi滑板动作-九宫格.md \
  --image 项目-视频-日漫女孩/3-关键帧/关键帧-Yi滑板动作-九宫格.png \
  --ref 项目-视频-日漫女孩/2-素材/角色/Yi/人物参考-Yi-运动服.png \
  --ar 1:1 --quality 2k
```

### 图生图 Prompt 规则

当使用 `--ref` 提供参考图时，prompt **只描述需要修改/新增的内容**，不要复述参考图里已有的外观特征（颜色、材质、风格、姿势、构图等）。模型会自己从参考图里提取这些信息，重复描述反而会干扰生成、导致结果偏离参考图。

**纯文生图（无 `--ref`）**：详细描述外观，越具体越好。

**图生图（有 `--ref`）**：只写差异。

### 永远不要覆盖参考文件

**`--image`（输出路径）和 `--ref`（参考图路径）必须不同。** 即使用户没明说，也绝不能让输出路径等于任何一个参考图路径——那会销毁原图。

如果用户的请求会导致覆盖（例如"基于 v4.png 生成新风格，保存到 v4.png"），**自动改名**：在原文件名后追加风格/版本后缀，如 `刀盾狗-v4.png` → `刀盾狗-v4-雕像.png`，然后告知用户输出的新路径。不要在生成前再追问，直接改名即可。

---

## 视频生成

### 基本命令

视频生成通过 content-gen skill 执行：

```bash
npx -y bun .claude/skills/content-gen/scripts/video/main.ts \
  --promptfiles <提示词文件.md> \
  --video <输出路径.mp4> \
  [选项]
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--prompt <text>`, `-p` | 直接传入 prompt 文本 | - |
| `--promptfiles <files...>` | 从文件读取 prompt | - |
| `--video <path>` | 输出视频路径（**必须**） | - |
| `--ref <files...>` | 参考图片/视频路径 | - |
| `--ar <ratio>` | 宽高比：`16:9`、`9:16`、`1:1` | - |
| `--duration <seconds>` | 视频时长 | 5 |
| `--quality <preset>` | 质量预设 | - |
| `--model <id>` | 模型 ID | 从 `.env` 读取 |
| `--timeout <seconds>` | 超时时间 | 600 |
| `--json` | JSON 输出 | - |

### 默认参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `resolution` | 由后端决定 | 未指定时后端自动选择 |
| `duration` | `5` 秒 | 默认视频长度 |
| `ratio` | 未指定 | 建议显式指定 `--ar 16:9` 或 `--ar 9:16` |

**规则**：
- 视频生成没有硬编码默认分辨率，由后端根据模型能力自动决定
- 建议在 prompt 文件中显式指定 `resolution` 和 `ratio`，确保可复现性
- 如需特定分辨率，在 submit 时传入 `--resolution 1080p` 或 `--width 1920 --height 1080`

### 视频生成示例

```bash
npx -y bun .claude/skills/content-gen/scripts/video/main.ts \
  --promptfiles 项目-视频-日漫女孩/4-视频/视频-街头行走.md \
  --video 项目-视频-日漫女孩/4-视频/视频-街头行走.mp4 \
  --ref 项目-视频-日漫女孩/3-关键帧/关键帧-街头行走-v1.png \
  --ar 16:9 --duration 5
```

---

## 网格切割

### 九宫格切割

```bash
npx -y bun .claude/skills/content-gen/scripts/image/grid.ts split \
  <输入图片.png> <输出目录> --grid 3x3 [--prefix <前缀>]
```

### 四宫格切割

```bash
npx -y bun .claude/skills/content-gen/scripts/image/grid.ts split \
  <输入图片.png> <输出目录> --grid 2x2 [--prefix <前缀>]
```

### 自定义面板切割

```bash
npx -y bun .claude/skills/content-gen/scripts/image/grid.ts panels \
  <输入图片.png> <输出目录> \
  --panels '[{"name":"面板1","left":0,"top":0,"width":0.5,"height":0.5},...]'
```

### 示例

```bash
# 角色参考图切割（左侧三视图 + 右侧 3×3）
npx -y bun .claude/skills/content-gen/scripts/image/grid.ts panels \
  人物参考-Yi-运动服.png ./拆分 \
  --panels '[{"name":"正面","left":0,"top":0,"width":0.33,"height":0.7},{"name":"侧面","left":0,"top":0.7,"width":0.165,"height":0.3},{"name":"背面","left":0.165,"top":0.7,"width":0.165,"height":0.3},{"name":"开心","left":0.33,"top":0,"width":0.223,"height":0.33},{"name":"愤怒","left":0.553,"top":0,"width":0.223,"height":0.33},{"name":"悲伤","left":0.776,"top":0,"width":0.224,"height":0.33},{"name":"惊讶","left":0.33,"top":0.33,"width":0.223,"height":0.33},{"name":"冷漠","left":0.553,"top":0.33,"width":0.223,"height":0.33},{"name":"害羞","left":0.776,"top":0.33,"width":0.224,"height":0.33},{"name":"战斗","left":0.33,"top":0.66,"width":0.223,"height":0.34},{"name":"奔跑","left":0.553,"top":0.66,"width":0.223,"height":0.34},{"name":"受伤","left":0.776,"top":0.66,"width":0.224,"height":0.34}]'

# 场景参考图切割（九宫格）
npx -y bun .claude/skills/content-gen/scripts/image/grid.ts split \
  场景参考-日本街道-白天.png ./拆分 --grid 3x3 --prefix 日本街道
```

---

## Provider 选择

图片和视频生成支持多种 provider，通过 content-gen skill 选择：

| Provider | 环境变量 | 用途 |
|----------|----------|------|
| **newapi** | `NEW_API_BASE_URL`, `API_KEY` | 图片生成（默认）、视频生成 |
| **volcengine** | `ARK_API_KEY` | 视频生成（火山引擎） |

**当 skill 被调用时，必须先询问用户选择 provider 和 model**，再执行生成操作。

### 图片模型选项

- `gpt-image-2`（默认）
- `doubao-seedream-5-0-260128`

### 视频模型选项

- `doubao-seedance-2-0-260128`
- `doubao-seedance-2-0-fast-260128`
