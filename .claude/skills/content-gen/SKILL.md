---
name: content-gen
description: |
  AI content generation: images (newapi, with 九宫格/四宫格 grid support), videos (VolcEngine/newapi), and audio/TTS (MiMo).
  Use when user asks to generate, create, draw, edit images, generate/create/make videos, generate speech/voice/audio/TTS, or create grid reference sheets (九宫格/四宫格).
---

# Content Generation

This skill handles three content types. Read the appropriate sub-skill file:

- **Images** → Read [`image-gen.md`](image-gen.md) in this directory
- **Videos** → Read [`video-gen.md`](video-gen.md) in this directory
- **Audio/TTS** → Read [`tts-gen.md`](tts-gen.md) in this directory

## Script Directory

`SKILL_DIR` = this SKILL.md file's directory

## Invocation — 必须先询问 provider 和 model

**当 skill 被调用时，必须先用 AskUserQuestion 询问用户两个问题，再执行任何生成操作：**

### 问题 1：选择 Provider

根据任务类型（图片/视频/音频），提供对应的 provider 选项：

**图片生成**的 provider 选项：
- `newapi` — new-api OpenAI 兼容接口

**视频生成**的 provider 选项：
- `volcengine` — 火山引擎 ARK API
- `newapi` — new-api OpenAI 兼容接口

**音频/TTS 生成**的 provider 选项：
- `new-api` — new-api 中转站（默认）
- `mimo` — 官方 MiMo API

### 问题 2：选择 Model

根据用户选择的 provider，列出该 provider 支持的模型供选择（或让用户输入自定义模型 ID）：

**newapi 图片模型**：`gpt-image-2`（默认）、`doubao-seedream-5-0-260128`
**VolcEngine 视频模型**：`doubao-seedance-2-0-260128`, `doubao-seedance-2-0-fast-260128`
**TTS 模型**：`mimo-v2.5-tts`（默认）、`mimo-v2.5-tts-voicedesign`、`mimo-v2.5-tts-voiceclone`

询问完毕后，将用户选择的 `--provider` 和 `--model` 传入脚本命令。

## Providers

Images, videos, and audio support multiple providers, selectable via `--provider`:

| Provider | Env vars | Used for |
|----------|----------|----------|
| **newapi** | `NEW_API_BASE_URL`, `API_KEY` | Image (default) |
| **volcengine** | `ARK_API_KEY` | Video (default when ARK key present) |
| **newapi** | `NEW_API_BASE_URL`, `API_KEY` | Video |
| **new-api** | `MIMO_API_KEY`, `MIMO_BASE_URL` | TTS (default) |
| **mimo** | `MIMO_API_KEY`, `MIMO_BASE_URL` | TTS |

## Shared .env Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `NEW_API_BASE_URL` | image (newapi), video (newapi) | API base URL |
| `API_KEY` | image (newapi), video (newapi) | API key |
| `ARK_API_KEY` | video (volcengine) | VolcEngine API key |
| `DEFAULT_IMAGE_GEN_MODEL` | image | Image model ID |
| `DEFAULT_VIDEO_GEN_MODEL` | video | Video model ID |
| `MIMO_API_KEY` | tts | MiMo API key |
| `MIMO_BASE_URL` | tts | MiMo API base URL (default: `https://api.xiaomimimo.com/v1`) |
| `DEFAULT_TTS_MODEL` | tts | Default TTS model ID |
| `TTS_PROVIDER` | tts | Default TTS provider: `mimo` or `new-api` |
