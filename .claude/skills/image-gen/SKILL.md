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
| `--json` | JSON output |

## Generation Mode

**Default**: Sequential generation (one image at a time).

**Parallel**: Only use when user explicitly requests parallel generation. Launch multiple subagents with `run_in_background=true`.

## Error Handling

- Missing API key or base URL -> error with setup instructions
- Generation failure -> auto-retry once
