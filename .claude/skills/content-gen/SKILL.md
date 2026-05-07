---
name: content-gen
description: |
  AI content generation: images (newapi/Cool API) and videos (VolcEngine/newapi/Cool API).
  Use when user asks to generate, create, draw, edit images or generate/create/make videos.
---

# Content Generation

This skill handles two content types. Read the appropriate sub-skill file:

- **Images** → Read [`image-gen.md`](image-gen.md) in this directory
- **Videos** → Read [`video-gen.md`](video-gen.md) in this directory

## Script Directory

`SKILL_DIR` = this SKILL.md file's directory

## Invocation — 必须先询问 provider 和 model

**当 skill 被调用时，必须先用 AskUserQuestion 询问用户两个问题，再执行任何生成操作：**

### 问题 1：选择 Provider

根据任务类型（图片/视频），提供对应的 provider 选项：

**图片生成**的 provider 选项：
- `cool` — Cool API gateway（支持 gpt_image_2, seedream_4_5, midjourney_v7 等）
- `newapi` — new-api OpenAI 兼容接口

**视频生成**的 provider 选项：
- `cool` — Cool API gateway（支持 seedance_2, kling_3_sora, veo_3_1_fast 等）
- `volcengine` — 火山引擎 ARK API
- `newapi` — new-api OpenAI 兼容接口

### 问题 2：选择 Model

根据用户选择的 provider，列出该 provider 支持的模型供选择（或让用户输入自定义模型 ID）：

**Cool 图片模型**：`gpt_image_2`, `seedream_4_5`, `midjourney_v7`, `flux_kontext_pro`
**Cool 视频模型**：`seedance_2`, `seedance_2_fast`, `seedance_1_5_pro_audio`, `kling_3_silent`, `kling_3_omni`, `kling_3_audio`, `vidu_q3`, `sora_2`, `wan_2_6`, `veo_3_1_fast`
**newapi 图片模型**：`doubao-seedream-5-0-260128`
**VolcEngine 视频模型**：`doubao-seedance-2-0-260128`, `doubao-seedance-2-0-fast-260128`

询问完毕后，将用户选择的 `--provider` 和 `--model` 传入脚本命令。

## Providers

Both images and videos support multiple providers, selectable via `--provider`:

| Provider | Env vars | Used for |
|----------|----------|----------|
| **newapi** | `NEW_API_BASE_URL`, `API_KEY` | Image (default when no Cool key) |
| **cool** | `COOL_API_KEY`, `COOL_BASE_URL` | Image + Video (auto-detected when key present) |
| **volcengine** | `ARK_API_KEY` | Video (default when no Cool key) |
| **newapi** | `NEW_API_BASE_URL`, `API_KEY` | Video |

## Shared .env Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `NEW_API_BASE_URL` | image (newapi), video (newapi) | API base URL |
| `API_KEY` | image (newapi), video (newapi) | API key |
| `ARK_API_KEY` | video (volcengine) | VolcEngine API key |
| `COOL_API_KEY` | image (cool), video (cool) | Cool API gateway key |
| `COOL_BASE_URL` | image (cool), video (cool) | Cool base URL (default: `https://api.mjapi.cc.cd`) |
| `DEFAULT_IMAGE_GEN_MODEL` | image | Image model ID |
| `DEFAULT_VIDEO_GEN_MODEL` | video | Video model ID |
