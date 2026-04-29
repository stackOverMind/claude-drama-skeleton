---
name: tts
description: AI text-to-speech using Xiaomi MiMo TTS API. Supports preset voices, voice design via text description, voice cloning from audio samples, and audio extraction from video. Use when user asks to generate speech, voice, audio, TTS, or extract audio from video.
---

# Text-to-Speech (TTS) & Audio Tools

语音合成，基于小米 MiMo TTS API（OpenAI 兼容格式）。支持预置音色、文本设计音色、音色复刻三种模式，以及从视频中提取音频。

## Script Directory

**Agent Execution**:
1. `SKILL_DIR` = this SKILL.md file's directory
2. TTS script = `${SKILL_DIR}/scripts/main.ts`
3. Audio extraction script = `${SKILL_DIR}/scripts/extract-audio.ts`

## Configuration

Reads from project root `.env`:

| Variable | Description |
|----------|-------------|
| `MIMO_API_KEY` | MiMo API key |
| `MIMO_BASE_URL` | API base URL (default: `https://api.xiaomimimo.com/v1`) |
| `DEFAULT_TTS_MODEL` | Default model ID (default: `mimo-v2.5-tts`) |
| `TTS_PROVIDER` | Default provider: `mimo` or `new-api` (default: `new-api`) |

### Provider 说明

| Provider | 认证方式 | 适用场景 |
|----------|----------|----------|
| `new-api` (默认) | `Authorization: Bearer` | new-api 中转站 |
| `mimo` | `api-key` | 官方 MiMo API |

## Usage

### 预置音色（默认）

使用内置精品音色，支持自然语言风格控制和音频标签控制。

```bash
# 基础用法
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "你好，世界！" --audio hello.wav

# 指定音色
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "你好" --audio hello.wav --voice 冰糖

# 带风格指令
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "终于考过了！" --audio excited.wav --style "轻快上扬的语调，带着压抑不住的激动与小骄傲"

# 音频标签控制
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "(开心)今天天气真好！" --audio happy.wav
```

### 音色设计（Voice Design）

通过文本描述生成定制音色，无需预置音色或音频样本。

```bash
# 描述音色并合成
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "欢迎来到午夜电台。" --audio radio.wav \
  --mode design \
  --voice "一位三十多岁的男性，嗓音低沉磁性，语速缓慢，像深夜电台DJ"
```

### 音色复刻（Voice Clone）

基于音频样本复刻任意音色。

```bash
# 用音频样本复刻音色
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "这是复刻后的声音。" --audio cloned.wav \
  --mode clone \
  --voice sample.mp3
```

### 从文件读取

```bash
# 从文件读取合成文本
npx -y bun ${SKILL_DIR}/scripts/main.ts --textfile script.txt --audio output.wav

# 从文件读取风格指令
npx -y bun ${SKILL_DIR}/scripts/main.ts --text "台词内容" --stylefile style.txt --audio output.wav
```

## Options

| Option | Description |
|--------|-------------|
| `--text <text>`, `-t` | 要合成的文本（assistant 角色内容） |
| `--textfile <path>` | 从文件读取合成文本 |
| `--audio <path>` | 输出音频路径（required） |
| `--mode <mode>` | 模式: `preset`（默认）/ `design` / `clone` |
| `--voice <id\|desc\|path>` | 预置音色ID / 音色描述 / 音频样本路径 |
| `--style <text>` | 自然语言风格指令（user 角色内容） |
| `--stylefile <path>` | 从文件读取风格指令 |
| `-m, --model <id>` | 模型 ID（默认从 `.env` 读取） |
| `--format <format>` | 音频格式: `wav`（默认）/ `mp3` / `pcm16` / `opus` |
| `--provider <provider>` | API provider: `mimo` / `new-api`（默认: `new-api`） |
| `--json` | JSON 输出 |
| `-h, --help` | 显示帮助 |

## 预置音色列表

| Voice ID | 语言 | 性别 |
|----------|------|------|
| `mimo_default` | 中文/英文（因集群而异） | - |
| `冰糖` | 中文 | 女性 |
| `茉莉` | 中文 | 女性 |
| `苏打` | 中文 | 男性 |
| `白桦` | 中文 | 男性 |
| `Mia` | 英文 | 女性 |
| `Chloe` | 英文 | 女性 |
| `Milo` | 英文 | 男性 |
| `Dean` | 英文 | 男性 |

## 音频标签示例

在 `--text` 中直接嵌入标签：

```
(开心)今天天气真好！
(慵懒)再让我睡五分钟……
(东北话)哎呀妈呀，这天儿也忒冷了吧！
(唱歌)原谅我这一生不羁放纵爱自由
```

细粒度控制标签：

```
（紧张，深呼吸）呼……冷静，冷静。
（极其疲惫，有气无力）师傅……到地方了叫我一声……
```

## 模式说明

| 模式 | Model ID | `--voice` 含义 | 支持的功能 |
|------|----------|----------------|------------|
| `preset` | `mimo-v2.5-tts` | 预置音色 ID | 风格指令、音频标签、唱歌 |
| `design` | `mimo-v2.5-tts-voicedesign` | 音色描述文本 | 风格指令、音频标签 |
| `clone` | `mimo-v2.5-tts-voiceclone` | 音频样本文件路径 | 风格指令、音频标签 |

## 音频提取（从视频分离音频）

用于从视频文件中提取音频，支持截取片段、调整采样率等。需要系统安装 `ffmpeg`。

```bash
# 提取完整音频为 WAV
npx -y bun ${SKILL_DIR}/scripts/extract-audio.ts -i video.mp4 -o audio.wav

# 提取前 10 秒为 MP3
npx -y bun ${SKILL_DIR}/scripts/extract-audio.ts -i video.mp4 -o audio.mp3 --duration 10

# 提取片段（1:30 ~ 1:40）为 16kHz 单声道 WAV（适合 voice clone）
npx -y bun ${SKILL_DIR}/scripts/extract-audio.ts -i video.mp4 -o segment.wav \
  --start 00:01:30 --duration 10 --sample-rate 16000 --channels 1
```

### 音频提取选项

| Option | Description |
|--------|-------------|
| `-i, --input <path>` | 输入视频文件（required） |
| `-o, --output <path>` | 输出音频文件（required） |
| `--format <format>` | 输出格式: `wav` / `mp3` / `aac` / `flac`（默认自动识别后缀） |
| `--start <time>` | 开始时间，如 `00:01:30` 或 `90s` |
| `--duration <time>` | 持续时间，如 `00:00:10` 或 `10s` |
| `--sample-rate <rate>` | 采样率: `16000` / `22050` / `44100` / `48000`（默认: 44100） |
| `--channels <n>` | 声道数: `1`（单声道）/ `2`（立体声，默认） |
| `-q, --quality <n>` | MP3 质量: 0-9，0=最好（默认: 2） |
| `--json` | JSON 输出 |
| `-h, --help` | 显示帮助 |

## Error Handling

- Missing API key -> error with setup instructions
- Generation failure -> auto-retry once
- 音频样本超过 10MB -> error
