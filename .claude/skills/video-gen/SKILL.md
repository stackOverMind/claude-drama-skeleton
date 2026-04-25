---
name: video-gen
description: AI video generation using Doubao Seedance API via VolcEngine official API. Supports text-to-video, image-to-video, video-to-video, and audio-to-video with configurable duration, resolution, and aspect ratio. Use when user asks to generate, create, or make videos.
---

# Video Generation

Video generation powered by Doubao Seedance via VolcEngine official API (`ark.cn-beijing.volces.com`).

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = this SKILL.md file's directory
2. Script path = `${SKILL_DIR}/scripts/main.ts` (VolcEngine official API)
3. Alternative: `${SKILL_DIR}/scripts/main_new_api.ts` (new-api compatible)

### Switching Between APIs

- **Official API** (default): Uses `ARK_API_KEY`, calls `ark.cn-beijing.volces.com` directly. Supports images, videos, audio as references.
- **new-api**: Uses `NEW_API_BASE_URL` + `API_KEY`, OpenAI-compatible `/v1/video/generations` endpoint. Supports single image only.

Choose the script based on your API availability and feature needs.

## Configuration

### Official API (`main.ts`)

| Variable | Description |
|----------|-------------|
| `ARK_API_KEY` | VolcEngine API key |
| `DEFAULT_VIDEO_GEN_MODEL` | Model ID (e.g. `doubao-seedance-2-0-260128`) |

### new-api (`main_new_api.ts`)

| Variable | Description |
|----------|-------------|
| `NEW_API_BASE_URL` | API base URL |
| `API_KEY` | API key |
| `DEFAULT_VIDEO_GEN_MODEL` | Model ID |

## Usage

### Three-Step Async Workflow (Recommended)

Video generation is asynchronous and may take several minutes. Use the three-step workflow to avoid blocking:

```bash
# Step 1: Submit task — returns task_id immediately
npx -y bun ${SKILL_DIR}/scripts/main.ts submit --prompt "一只猫在花园里弹钢琴" --image cat.jpg
# Output: task_xxxxxxxx

# Step 2: Check status manually (repeat until status is "succeeded")
npx -y bun ${SKILL_DIR}/scripts/main.ts status task_xxxxxxxx
# Output: Status: processing

# Step 3: Download when succeeded
npx -y bun ${SKILL_DIR}/scripts/main.ts download task_xxxxxxxx --video cat-piano.mp4
# Output: /path/to/cat-piano.mp4
```

### One-Shot Mode (Legacy)

For quick tests, use `run` (or omit command) to submit, poll, and download in one go:

```bash
# Basic text-to-video
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "一只猫在花园里弹钢琴" --video cat-piano.mp4

# Image-to-video
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "让猫动起来" --video cat-move.mp4 --image cat.jpg

# With duration and aspect ratio
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "风景延时摄影" --video landscape.mp4 --duration 5 --ar 16:9

# Multiple reference images
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "角色一致性动画" --video char.mp4 --image char1.jpg --image char2.jpg

# Video-to-video (reference video)
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "风格转换" --video styled.mp4 --ref-video source.mp4

# Audio-to-video (reference audio)
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "配合音乐节奏" --video synced.mp4 --ref-audio music.mp3

# From prompt files
npx -y bun ${SKILL_DIR}/scripts/main.ts run --promptfiles scene.md --video output.mp4

# Specific model
npx -y bun ${SKILL_DIR}/scripts/main.ts run --prompt "一只狗在奔跑" --video dog.mp4 --model doubao-seedance-2-0-260128

# new-api version
npx -y bun ${SKILL_DIR}/scripts/main_new_api.ts run --prompt "日落海边" --video sunset.mp4 --json
```

**Note**: `main_new_api.ts` only supports `--image` (single image), not `--ref-video` or `--ref-audio`.

## Commands

| Command | Description |
|---------|-------------|
| `submit` | Submit task, return `task_id` immediately |
| `status <task_id>` | Query task status |
| `download <task_id>` | Download video (only when `status == succeeded`) |
| `run` | One-shot: submit + poll + download (default) |

## Options

| Option | Description |
|--------|-------------|
| `--prompt <text>`, `-p` | Prompt text |
| `--promptfiles <files...>` | Read prompt from files (concatenated) |
| `--video <path>` | Output video path (required for `run`/`download`) |
| `--image <path>` | Input image(s) for image-to-video / reference images (can be used multiple times) |
| `--ref-video <path>` | Reference video for video-to-video |
| `--ref-audio <path>` | Reference audio for audio-to-video |
| `-m, --model <id>` | Model ID (default: from `.env`) |
| `--duration <seconds>` | Video duration in seconds (default: 5) |
| `--width <pixels>` | Video width |
| `--height <pixels>` | Video height |
| `--fps <number>` | Frames per second |
| `--seed <number>` | Random seed |
| `--ar <ratio>` | Aspect ratio (e.g., `16:9`, `9:16`, `1:1`) |
| `--resolution <string>` | Resolution preset (e.g., `1080p`, `720p`) |
| `--camera-fixed` | Fixed camera position |
| `--watermark` | Add watermark |
| `--generate-audio` | Generate audio |
| `--return-last-frame` | Return last frame |
| `--service-tier <tier>` | Service tier |
| `--draft` | Draft mode |
| `--frames <count>` | Frame count |
| `--n <count>` | Number of videos (default: 1) |
| `--json` | JSON output |
| `--poll-interval <seconds>` | Task status poll interval (default: 10, `run` only) |
| `--max-wait <seconds>` | Max wait time for task completion (default: 1800, `run` only) |

## Async Task Flow

1. Submit task to `POST /api/v3/contents/generations/tasks` → receive `id`
2. Poll task status via `GET /api/v3/contents/generations/tasks/{id}` until `succeeded` or `failed`
3. Download video from `content.video_url` on success

## API Request Format

The script constructs a `content` array following the official VolcEngine API:

- Text prompt → `{ type: "text", text: "..." }`
- Image files → `{ type: "image_url", image_url: { url: "..." }, role: "reference_image" }`
- Video files → `{ type: "video_url", video_url: { url: "..." }, role: "reference_video" }`
- Audio files → `{ type: "audio_url", audio_url: { url: "..." }, role: "reference_audio" }`

Other parameters (`duration`, `ratio`, `generate_audio`, etc.) are sent as top-level fields.

## Error Handling

- Missing API key -> error with setup instructions
- Task submission failure -> auto-retry once
- Task failure -> report error code and message
- Timeout -> report task_id for manual check
