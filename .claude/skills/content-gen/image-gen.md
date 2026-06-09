# Image Generation

Image generation via new-api OpenAI-compatible API.

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = parent SKILL.md file's directory (content-gen)
2. Script path = `${SKILL_DIR}/scripts/image/main.ts`

## Configuration

| Variable | Description |
|----------|-------------|
| `NEW_API_BASE_URL` | API base URL |
| `API_KEY` | API key for authentication |
| `DEFAULT_IMAGE_GEN_MODEL` | Model ID (e.g. `doubao-seedream-5-0-260128`) |

## Usage

```bash
# Basic text-to-image
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "一只可爱的猫" --image cat.png

# With aspect ratio
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "风景画" --image landscape.png --ar 16:9

# Image-to-image editing
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "把猫变成赛博朋克风格" --image cyber-cat.png --ref cat.png

# High quality
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "一只猫" --image out.png --quality normal

# From prompt files
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --promptfile system.md content.md --image out.png

# JSON output
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "一只猫" --image out.png --json
```

## Options

| Option | Description |
|--------|-------------|
| `--prompt <text>`, `-p` | Prompt text |
| `--promptfile <files...>` | Read prompt from files (concatenated) |
| `--image <path>` | Output image path (required) |
| `-m, --model <id>` | Model ID (default: from `.env`) |
| `--ar <ratio>` | Aspect ratio (e.g., `16:9`, `1:1`, `4:3`) |
| `--size <WxH>` | Size (e.g., `1024x1024`) |
| `--quality normal\|2k` | Quality preset (default: 2k) |
| `--ref <files...>` | Reference images for image-to-image editing |
| `--n <count>` | Number of images (default: 1) |
| `--timeout <seconds>` | Request timeout (default: 300) |
| `--json` | JSON output |

## Grid Generation (九宫格 / 四宫格)

生成角色/场景参考图网格，并自动切割为独立图片。

### 生成九宫格角色参考图

```bash
# 1. 生成九宫格大图
npx -y bun ${SKILL_DIR}/scripts/image/main.ts \
  --prompt "Create a 3x3 character reference sheet. Grid layout: Row 1: Front view | Side view | Back view. Row 2: Happy | Angry | Sad. Row 3: Surprised | Neutral | Action. Character: a young female warrior with long silver hair, wearing red armor. Style: anime, clean white background, full body in each cell, consistent outfit." \
  --image 角色/主角/参考图.png --ar 1:1 --quality normal

# 2. 自动切割为 9 张独立图片
npx -y bun ${SKILL_DIR}/scripts/image/grid.ts split 角色/主角/参考图.png 角色/主角/ --grid 3x3 --prefix 主角
# → 输出: 角色/主角/主角_cell_1_1.png ... 主角_cell_3_3.png
```

### 生成四宫格场景参考图

```bash
# 1. 生成四宫格大图
npx -y bun ${SKILL_DIR}/scripts/image/main.ts \
  --prompt "Create a 2x2 grid. Row 1: Day view | Night view. Row 2: Wide shot | Close-up. Scene: a medieval castle on a hill. Style: fantasy art, consistent architecture across all cells." \
  --image 场景/城堡/参考图.png --ar 1:1 --quality normal

# 2. 自动切割为 4 张独立图片
npx -y bun ${SKILL_DIR}/scripts/image/grid.ts split 场景/城堡/参考图.png 场景/城堡/ --grid 2x2 --prefix 城堡
# → 输出: 场景/城堡/城堡_cell_1_1.png ... 城堡_cell_2_2.png
```

### Grid Prompt 模板

**角色九宫格**：

```
Create a 3x3 character reference sheet for [角色名].
Grid layout:
- Row 1: Front view | Side view | Back view (same neutral pose)
- Row 2: Happy expression | Angry expression | Sad expression
- Row 3: Surprised expression | Neutral expression | Action pose

Character details:
- Appearance: [外貌描述]
- Outfit: [服装描述]
- Style: [项目风格]

Requirements:
- Each cell shows the full body
- Consistent outfit across all cells
- Clean white background
- Only expression, angle, and pose change
```

**场景九宫格**：

```
Create a 3x3 scene reference sheet for [场景名].
Grid layout:
- Row 1: Wide shot | Medium shot | Close-up detail
- Row 2: Day lighting | Sunset lighting | Night lighting
- Row 3: Sunny weather | Cloudy atmosphere | Rainy atmosphere

Scene details:
- Description: [场景描述]
- Style: [项目风格]

Requirements:
- Same location in all cells
- Consistent architectural elements
- Only lighting, weather, and camera distance change
```

### Grid 切割命令

```bash
# 切割九宫格
npx -y bun ${SKILL_DIR}/scripts/image/grid.ts split <input.png> <output_dir> --grid 3x3 [--prefix name]

# 切割四宫格
npx -y bun ${SKILL_DIR}/scripts/image/grid.ts split <input.png> <output_dir> --grid 2x2 [--prefix name]
```

| Option | Description |
|--------|-------------|
| `input` | 输入的网格大图路径 |
| `output_dir` | 输出目录 |
| `--grid` | 网格类型：`3x3` 或 `2x2` |
| `--prefix` | 输出文件名前缀 |

**依赖**：切割功能需要安装 `sharp`（推荐）或 `jimp`：

```bash
npm install sharp
```

## Generation Mode

**Default**: Sequential generation (one image at a time).

**Parallel**: Only use when user explicitly requests parallel generation. Launch multiple subagents with `run_in_background=true`.

## 关键规则：永远不要覆盖已有输出文件

**生成任何内容时，绝不要覆盖已存在的输出文件。** 如果目标路径已存在，**自动追加版本号**（如 `-v2`、`-v3`），不要删除旧文件。

- 示例：`故事板-Chico.png` 已存在 → 新文件自动命名为 `故事板-Chico-v2.png`
- 示例：`Chico-快拔初生犊.mp4` 已存在 → 新文件自动命名为 `Chico-快拔初生犊-v2.mp4`

**不要在生成前询问用户是否覆盖，直接自动改名即可。** 同时告知用户新文件路径。

## 关键规则：永远不要覆盖参考文件

**`--image`（输出路径）和 `--ref`（参考图路径）必须不同。** 即使用户没明说，也绝不能让输出路径等于任何一个参考图路径——那会销毁原图。

如果用户的请求会导致覆盖（例如"基于 v4.png 生成新风格，保存到 v4.png"），**自动改名**：在原文件名后追加风格/版本后缀，如 `刀盾狗-v4.png` → `刀盾狗-v4-雕像.png`，然后告知用户输出的新路径。不要在生成前再追问，直接改名即可。

## 风格提示词自动注入

当用户没有明确指定画面风格时，**自动从项目目录的 `项目说明.md` 中读取 `## 画面风格提示词` 字段**，将其追加到 prompt 末尾作为风格锚定。

**读取规则**：
1. 检测当前工作目录是否在某个 `项目-*/` 下
2. 查找同级目录中的 `项目说明.md`
3. 提取 `## 画面风格提示词` 下方的内容（到下一个 `##` 标题前）
4. 如果该字段存在且非空，则追加到 prompt：`{原始 prompt}，{风格提示词}`
5. 如果字段为空或不存在，则不加任何风格后缀

**示例**：
- 项目说明.md 中风格提示词为：`2D 动画风格，细腻手绘质感`
- 用户 prompt：`一只可爱的猫`
- 实际提交 prompt：`一只可爱的猫，2D 动画风格，细腻手绘质感`

---

## 生成流程：先写 Prompt MD，后生成

**当用户请求生成图片时，必须先询问用户选择流程：**

1. **先写 Prompt 文件**（推荐）— 用户确认 prompt 后再生成
2. **直接生成** — 立即执行生成

**默认选择「先写 Prompt 文件」**，让用户有机会审阅和修改。

### Prompt MD 文件模板

如果选择「先写 Prompt 文件」，按以下模板创建 `.md` 文件：

```markdown
# {画面主题} Prompt

## 参考图

- **图片1**：{描述} `{绝对路径}`
- **图片2**：{描述} `{绝对路径}`
（如有多个参考图，按图片1/图片2/...编号）

## 画面内容

{场景描述、主体、动作、环境等}

## 镜头语言

{视角、焦距、构图、景深、光影方向等}

## 风格

{艺术风格、色彩、笔触、氛围等}

## 负面 Prompt

{需要排除的元素}
```

**必填字段**：参考图（如有）、画面内容、风格
**可选字段**：镜头语言、负面 Prompt

### 参考图命名规则

Prompt 文件中指代参考图时，**必须按 `--ref` 参数中的提交顺序**，使用"图片1"、"图片2"等，**绝不能出现文件名**。

### Prompt Rules

#### 图生图（带 `--ref`）：只写改动点，不要画蛇添足

当使用 `--ref` 提供参考图时，prompt **只描述需要修改/新增的内容**，不要复述参考图里已有的外观特征（颜色、材质、风格、姿势、构图等）。模型会自己从参考图里提取这些信息，重复描述反而会干扰生成、导致结果偏离参考图。

**纯文生图（无 `--ref`）**：详细描述外观，越具体越好。

**图生图（有 `--ref`）**：只写差异。

### 生成命令示例

```bash
# 文生图
npx -y bun ${SKILL_DIR}/scripts/image/main.ts \
  --promptfile prompt.md \
  --image output.png \
  --ar 16:9 --quality normal

# 图生图
npx -y bun ${SKILL_DIR}/scripts/image/main.ts \
  --promptfile prompt.md \
  --image output.png \
  --ref ref1.png ref2.png \
  --ar 16:9 --quality normal
```

## Error Handling

- Missing API key or base URL -> error with setup instructions
- Generation failure -> auto-retry once
