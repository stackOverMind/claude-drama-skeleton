---
name: image-gen
description: AI image generation using Doubao Seedream API. Supports text-to-image and image-to-image with aspect ratios and quality presets. Use when user asks to generate, create, draw, or edit images.
---

# Image Generation

Image generation powered by Doubao Seedream via OpenAI-compatible API.

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = this SKILL.md file's directory
2. Script path = `${SKILL_DIR}/scripts/main.ts`

## Configuration

Reads from project root `.env`:

| Variable | Description |
|----------|-------------|
| `NEW_API_BASE_URL` | API base URL |
| `API_KEY` | API key for authentication |
| `DEFAULT_IMAGE_GEN_MODEL` | Model ID (e.g. `doubao-seedream-5-0-260128`) |

## Usage

```bash
# Basic (text-to-image)
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "一只可爱的猫" --image cat.png

# Image-to-image editing
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "把猫变成赛博朋克风格" --image cyber-cat.png --ref cat.png

# With aspect ratio
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "风景画" --image landscape.png --ar 16:9

# High quality
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "一只猫" --image out.png --quality 2k

# From prompt files
npx -y bun ${SKILL_DIR}/scripts/main.ts --promptfiles system.md content.md --image out.png

# Specific model
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "一只猫" --image out.png --model doubao-seedream-5-0-260128

# JSON output
npx -y bun ${SKILL_DIR}/scripts/main.ts --prompt "一只猫" --image out.png --json
```

## Options

| Option | Description |
|--------|-------------|
| `--prompt <text>`, `-p` | Prompt text |
| `--promptfiles <files...>` | Read prompt from files (concatenated) |
| `--image <path>` | Output image path (required) |
| `-m, --model <id>` | Model ID (default: from `.env`) |
| `--ar <ratio>` | Aspect ratio (e.g., `16:9`, `1:1`, `4:3`) |
| `--size <WxH>` | Size (e.g., `1024x1024`) |
| `--quality normal\|2k` | Quality preset (default: 2k) |
| `--ref <files...>` | Reference images for image-to-image editing |
| `--n <count>` | Number of images (default: 1) |
| `--timeout <seconds>` | Request timeout (default: 300) |
| `--json` | JSON output |

## Generation Mode

**Default**: Sequential generation (one image at a time).

**Parallel**: Only use when user explicitly requests parallel generation. Launch multiple subagents with `run_in_background=true`.

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
