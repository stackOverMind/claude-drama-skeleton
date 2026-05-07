# Image Generation

Image generation via multiple providers.

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = parent SKILL.md file's directory (content-gen)
2. Script path = `${SKILL_DIR}/scripts/image/main.ts`

## Provider Selection

Use `--provider` flag to select backend:

- **`--provider newapi`**: new-api OpenAI-compatible API. Uses `NEW_API_BASE_URL` + `API_KEY`. Supports `--size`, `--quality`, `--n`.
- **`--provider cool`**: Cool API gateway. Uses `COOL_API_KEY`. Supports all Cool image models (gpt_image_2, seedream_4_5, midjourney_v7, flux_kontext_pro, etc.). Async task: submit → poll → download.
- **Auto-detect** (default): Uses `cool` when `COOL_API_KEY` is set, otherwise `newapi`.

## Configuration

### newapi (`--provider newapi`)

| Variable | Description |
|----------|-------------|
| `NEW_API_BASE_URL` | API base URL |
| `API_KEY` | API key for authentication |
| `DEFAULT_IMAGE_GEN_MODEL` | Model ID (e.g. `doubao-seedream-5-0-260128`) |

### Cool (`--provider cool`)

| Variable | Description |
|----------|-------------|
| `COOL_API_KEY` | Cool API key (Bearer token) |
| `COOL_BASE_URL` | Cool base URL (default: `https://api.mjapi.cc.cd`) |
| `DEFAULT_IMAGE_GEN_MODEL` | Model ID (e.g. `gpt_image_2`, `seedream_4_5`, `midjourney_v7`) |

## Usage

```bash
# Basic (text-to-image, auto-detect provider)
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "一只可爱的猫" --image cat.png

# Explicit Cool provider
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --provider cool --prompt "一只可爱的猫" --image cat.png --model gpt_image_2

# With aspect ratio
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "风景画" --image landscape.png --ar 16:9

# Image-to-image editing
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "把猫变成赛博朋克风格" --image cyber-cat.png --ref cat.png

# Doubao specific: high quality
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --provider newapi --prompt "一只猫" --image out.png --quality 2k

# From prompt files
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --promptfiles system.md content.md --image out.png

# JSON output
npx -y bun ${SKILL_DIR}/scripts/image/main.ts --prompt "一只猫" --image out.png --json
```

## Options

| Option | Description |
|--------|-------------|
| `--provider <name>` | Backend: `newapi` or `cool` (default: auto-detect) |
| `--prompt <text>`, `-p` | Prompt text |
| `--promptfiles <files...>` | Read prompt from files (concatenated) |
| `--image <path>` | Output image path (required) |
| `-m, --model <id>` | Model ID (default: from `.env`) |
| `--ar <ratio>` | Aspect ratio (e.g., `16:9`, `1:1`, `4:3`) |
| `--size <WxH>` | Size (e.g., `1024x1024`) (newapi only) |
| `--quality normal\|2k` | Quality preset (default: 2k) (newapi only) |
| `--ref <files...>` | Reference images for image-to-image editing |
| `--n <count>` | Number of images (default: 1) (newapi only) |
| `--timeout <seconds>` | Request timeout (default: 300) |
| `--json` | JSON output |

## Generation Mode

**Default**: Sequential generation (one image at a time).

**Parallel**: Only use when user explicitly requests parallel generation. Launch multiple subagents with `run_in_background=true`.

## 关键规则：永远不要覆盖参考文件

**`--image`（输出路径）和 `--ref`（参考图路径）必须不同。** 即使用户没明说，也绝不能让输出路径等于任何一个参考图路径——那会销毁原图。

如果用户的请求会导致覆盖（例如"基于 v4.png 生成新风格，保存到 v4.png"），**自动改名**：在原文件名后追加风格/版本后缀，如 `刀盾狗-v4.png` → `刀盾狗-v4-雕像.png`，然后告知用户输出的新路径。不要在生成前再追问，直接改名即可。

## Prompt Rules

### 图生图（带 `--ref`）：只写改动点，不要画蛇添足

当使用 `--ref` 提供参考图时，prompt **只描述需要修改/新增的内容**，不要复述参考图里已有的外观特征（颜色、材质、风格、姿势、构图等）。模型会自己从参考图里提取这些信息，重复描述反而会干扰生成、导致结果偏离参考图。

**纯文生图（无 `--ref`）**：详细描述外观，越具体越好。

**图生图（有 `--ref`）**：只写差异。

示例对比：

```bash
# ❌ 错误：参考图已经是橘色柴犬团子，prompt 又把外观全描述一遍
--prompt "圆滚滚橘黄色柴犬团子，呆萌表情，毛绒质感，叼着刀，夹着金色圆盾，白色背景，3D 卡通风格" --ref ref.png

# ✅ 正确：只写要改的动作/场景
--prompt "改成冲锋姿势，举刀向前" --ref ref.png

# ✅ 正确：只写新增元素
--prompt "戴上中世纪头盔" --ref ref.png

# ✅ 正确：只写场景替换
--prompt "背景改为森林战场" --ref ref.png
```

## Error Handling

- Missing API key or base URL -> error with setup instructions
- Generation failure -> auto-retry once
