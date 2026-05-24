# Video Generation

Video generation via multiple providers.

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = parent SKILL.md file's directory (content-gen)
2. Script path = `${SKILL_DIR}/scripts/video/main.ts`

### Provider Selection

Use `--provider` flag to select backend:

- **`--provider volcengine`**: Uses `ARK_API_KEY`, calls `ark.cn-beijing.volces.com` directly. Supports images, videos, audio as references.
- **`--provider newapi`**: Uses `NEW_API_BASE_URL` + `API_KEY`, OpenAI-compatible `/v1/video/generations` endpoint.
- **Auto-detect** (default): Uses `volcengine` when `ARK_API_KEY` is set, otherwise `newapi`.

## Configuration

### VolcEngine (`--provider volcengine`)

| Variable | Description |
|----------|-------------|
| `ARK_API_KEY` | VolcEngine API key |
| `DEFAULT_VIDEO_GEN_MODEL` | Model ID (e.g. `doubao-seedance-2-0-260128`) |

### new-api (`--provider newapi`)

| Variable | Description |
|----------|-------------|
| `NEW_API_BASE_URL` | API base URL |
| `API_KEY` | API key |
| `DEFAULT_VIDEO_GEN_MODEL` | Model ID |

## Usage

### Video-to-Video 工作流

当用户要求"参考某个视频做修改"（如换头、换道具、改风格、改场景）时，使用 video-to-video（r2v）模式：

**核心逻辑**：用参考视频保动作/镜头/节奏，用 prompt 描述修改内容。

**前置条件**：
- 参考视频必须是 **HTTP/HTTPS URL**，不支持本地文件路径（后端要求 web url）。
- 如果参考视频在本地，需先上传到 OSS/S3/图床等获取可访问 URL。
- 当前项目使用阿里云 OSS，上传脚本见下方。

**r2v 专属限制**（与 text2video / image2video 不同）：
- ❌ 不支持 `--camera-fixed`
- ❌ 不支持 `--resolution`
- ✅ 支持 `--duration` / `--ar` / `--seed` / `--generate-audio`
- 参考视频通过 `--ref-video <url>` 传入

**OSS 上传脚本**：`${SKILL_DIR}/scripts/video/oss_upload.mjs`

```bash
# 1. 上传本地视频到 OSS（获取 web URL）
export $(grep -E "^ALIYUN|^OSS" .env | xargs)
node ${SKILL_DIR}/scripts/video/oss_upload.mjs "项目-视频-x/4-视频/参考视频.mp4"
# → https://xgy1.oss-cn-wulanchabu.aliyuncs.com/ootd/xxxx_参考视频.mp4

# 2. 写 prompt 文件（Step 0）
# 3. 用户确认（Step 1）

# 4. 提交（Step 2）——只用 --prompt，不用 --promptfiles
npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi submit \
  --prompt "把视频中的狗头换成猫头，其他一切不变" \
  --ref-video "https://xgy1.oss-cn-wulanchabu.aliyuncs.com/ootd/xxxx_参考视频.mp4" \
  --duration 10 --ar 1:1

# 5. 查询/下载（Step 3）
npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi status task_xxxx
npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi download task_xxxx \
  --video "项目-视频-x/4-视频/输出视频.mp4"
```

---

### MANDATORY Workflow — Prompt 持久化检查点

**绝对禁止**：跳过 prompt 文件持久化、直接调用 `submit` 提交视频任务。

每次生成视频之前，**必须**完成以下流程，缺一不可：

#### Step 0 — 写入持久化 prompt 文件（强制）

在调用 `submit` 之前，**必须**先把完整的 prompt 内容写入项目内的持久化文件。

**位置规则（强制）**：prompt 文件与最终视频文件**同目录、同主名、仅后缀不同**。

- 视频路径 `项目-漫剧-x/5-视频/第一集/镜头1.mp4` → prompt 路径 `项目-漫剧-x/5-视频/第一集/镜头1.md`
- 视频路径 `项目-视频-x/4-视频/开场.mp4` → prompt 路径 `项目-视频-x/4-视频/开场.md`
- 视频路径 `项目-视频-x/4-视频/结尾.mov` → prompt 路径 `项目-视频-x/4-视频/结尾.md`

即：把视频文件名的扩展名替换为 `.md`，写在同一目录。这样 prompt 与视频天然一一对应、就近可查、便于追溯返工。

**文件内容**（YAML frontmatter + 正文）：

```markdown
---
model: doubao-seedance-2-0-260128
duration: 5
ratio: "16:9"
resolution: 1080p
images:
  - 项目-漫剧-x/3-素材/角色/主角/形象.jpg
ref_video: null
ref_audio: null
seed: null
camera_fixed: false
generate_audio: false
status: pending_confirmation   # pending_confirmation → confirmed → submitted
---

# 视频提示词

<完整中文 prompt 正文>
```

#### Step 1 — 用户确认（强制阻塞点）

写完文件后，**必须停下**，向用户报告：

1. prompt 文件的相对路径（用 markdown 链接格式）
2. 关键参数摘要（model / duration / ratio / 引用素材列表）
3. 明确询问："请确认是否提交生成？确认后我会把 `status` 改为 `confirmed` 并调用 submit。"

未收到用户**显式确认**前，**禁止**执行 `submit`。即便用户上一句说过"开始生成"，本次的具体 prompt 文件仍需单独确认 —— 因为参数和措辞每次都可能变。

#### Step 2 — 提交任务

用户确认后：

1. 把 prompt 文件中的 `status` 改为 `confirmed`
2. 调用 submit，**用 `--prompt` 传入 prompt 正文**，不要在命令行里重写 prompt（避免与文件不一致）：

**Image-to-Video 示例**：
```bash
npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi submit \
  --prompt "一只胖橘猫战士，右手持锯齿短刀、左手持木质圆角盾，站在浅色瓷砖地面上，面向镜头露出憨态可掬的微笑" \
  --image 项目-漫剧-x/3-素材/角色/主角/形象.jpg \
  --duration 5 --ar 16:9
# Output: task_xxxxxxxx
```

**Video-to-Video 示例**（狗头换猫头）：
```bash
npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi submit \
  --prompt "以参考视频为运动与构图基准，完整保留其中所有动作、节奏、镜头、光照、地面、刀、盾、身体姿态与每一帧的轮廓位置——唯一的修改是把画面中那只胖柴犬的头部替换为一只胖橘猫的头" \
  --ref-video "https://xgy1.oss-cn-wulanchabu.aliyuncs.com/ootd/xxxx_挥舞刀盾捶胸.mp4" \
  --duration 10 --ar 1:1
# Output: task_xxxxxxxx
```

3. 把返回的 `task_id` 追加到 prompt 文件 frontmatter，并把 `status` 改为 `submitted`。

#### Step 3 — 查询状态 / 下载

```bash
# 查询状态（不下载）
npx -y bun ${SKILL_DIR}/scripts/video/main.ts status task_xxxxxxxx

# 查询状态 + 下载（自动轮询直到完成，然后下载）
npx -y bun ${SKILL_DIR}/scripts/video/main.ts download task_xxxxxxxx \
  --video 项目-漫剧-x/5-视频/第一集/镜头1.mp4
```

下载命令会自动轮询任务状态，直到任务成功完成后再下载视频。可通过 `--poll-interval` 和 `--max-wait` 控制轮询间隔和超时时间。

下载成功后，把视频路径回写到 prompt 文件 frontmatter 的 `output` 字段，便于追溯。

### 检查点为什么必须存在

- **可复现**：参数与 prompt 留痕，后续返工/微调有据可查。
- **可审阅**：用户在烧 API quota 之前看到完整 prompt，避免错字、错素材、错比例。
- **可批量**：多镜头任务可以先一次性写齐 prompt 文件，再统一确认、统一提交。

### 反例（禁止）

```bash
# ❌ 直接 submit 内联 prompt，无持久化文件
npx -y bun ${SKILL_DIR}/scripts/video/main.ts submit --prompt "一只猫在花园里弹钢琴" --image cat.jpg

# ❌ 写了文件但没等用户确认就 submit
# ❌ 命令行 prompt 与文件 prompt 不一致
```

## Commands

| Command | Description |
|---------|-------------|
| `submit` | Submit task, return `task_id` immediately |
| `status <task_id>` | Query task status |
| `download <task_id>` | Poll status until succeeded, then download video |

## Options

| Option | Description |
|--------|-------------|
| `--provider <name>` | Backend: `volcengine` or `newapi` (default: auto-detect) |
| `--prompt <text>`, `-p` | Prompt text (required) |
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
| `--poll-interval <seconds>` | Task status poll interval (default: 10) |
| `--max-wait <seconds>` | Max wait time for task completion (default: 1800) |

## 异步任务轮询（newapi Provider）

视频生成是异步任务：提交后返回 `task_id`，需要轮询查询状态直到完成。

**推荐轮询方式：使用 Monitor 工具**

对于 newapi provider：

```typescript
Monitor({
  command: `until npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi status ${task_id} | grep -qE 'succeeded|failed'; do sleep 10; done && npx -y bun ${SKILL_DIR}/scripts/video/main.ts --provider newapi status ${task_id}`,
  description: "Poll newapi video task until complete",
  persistent: false,
  timeout_ms: 1800000,
})
```

**Monitor 特点**：
- 每行 stdout 输出触发一次通知
- 不阻塞主会话，可继续工作
- `persistent: false` 时命令退出即结束
- 适合需要看进度的异步轮询场景

**替代方式：Bash + run_in_background**

```bash
# 一次性通知（命令完成时通知）
Bash({
  command: "npx -y bun scripts/video/main.ts download task_id --video output.mp4 --poll-interval 10 --max-wait 1800",
  run_in_background: true,
  timeout: 1900000,
})
```

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
- 用户 prompt：`一只可爱的猫在花园里玩耍`
- 实际提交 prompt：`一只可爱的猫在花园里玩耍，2D 动画风格，细腻手绘质感`

---

## Error Handling

- Missing API key -> error with setup instructions
- Task submission failure -> auto-retry once
- Task failure -> report error code and message
- Timeout -> report task_id for manual check
