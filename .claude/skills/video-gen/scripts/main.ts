import path from "node:path";
import process from "node:process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type { CliArgs, ContentItem, EnvConfig, UpstreamQueryResponse } from "./types";

function printUsage(): void {
  console.log(`Usage:
  # Step 1: Submit task (returns task_id immediately)
  npx -y bun scripts/main.ts submit --prompt "一只猫在花园里弹钢琴" [--image cat.jpg] [--ref-video source.mp4]

  # Step 2: Check task status
  npx -y bun scripts/main.ts status <task_id>

  # Step 3: Download video when status is SUCCESS
  npx -y bun scripts/main.ts download <task_id> --video output.mp4

  # One-shot mode (legacy): submit + poll + download
  npx -y bun scripts/main.ts run --prompt "一只猫在花园里弹钢琴" --video cat-piano.mp4

Submit Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from files (concatenated)
  --image <path>            Input image(s) for image-to-video (can be used multiple times)
  --ref-video <path>        Reference video for video-to-video
  --ref-audio <path>        Reference audio for audio-to-video
  -m, --model <id>          Model ID (default: from .env)
  --duration <seconds>      Video duration (default: 5)
  --width <pixels>          Video width
  --height <pixels>         Video height
  --fps <number>            Frames per second
  --seed <number>           Random seed
  --ar <ratio>              Aspect ratio (e.g., 16:9, 9:16, 1:1)
  --resolution <string>     Resolution preset (e.g., 1080p, 720p)
  --camera-fixed            Fixed camera position
  --watermark               Add watermark
  --generate-audio          Generate audio
  --return-last-frame       Return last frame
  --service-tier <tier>     Service tier
  --draft                   Draft mode
  --frames <count>          Frame count
  --n <count>               Number of videos (default: 1)
  --json                    JSON output

Status Options:
  <task_id>                 Task ID to check

Download Options:
  <task_id>                 Task ID to download
  --video <path>            Output video path (required)

Run Options (one-shot):
  Same as submit + --video <path> + --poll-interval + --max-wait

Configuration:
  Reads from project .env file:
    ARK_API_KEY              VolcEngine API key
    DEFAULT_VIDEO_GEN_MODEL  Model ID`);
}

function printSubmitUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts submit --prompt "text" [--image img.jpg] [--ref-video vid.mp4] [--ref-audio aud.mp3] [options]

  npx -y bun scripts/main.ts submit --promptfiles prompt.md [options]

Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from files
  --image <path>            Input image(s)
  --ref-video <path>        Reference video
  --ref-audio <path>        Reference audio
  -m, --model <id>          Model ID
  --duration <seconds>      Video duration
  --width <pixels>          Video width
  --height <pixels>         Video height
  --fps <number>            Frames per second
  --seed <number>           Random seed
  --ar <ratio>              Aspect ratio
  --resolution <string>     Resolution preset
  --camera-fixed            Fixed camera position
  --watermark               Add watermark
  --generate-audio          Generate audio
  --return-last-frame       Return last frame
  --service-tier <tier>     Service tier
  --draft                   Draft mode
  --frames <count>          Frame count
  --n <count>               Number of videos
  --json                    JSON output`);
}

function printStatusUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts status <task_id> [--json]`);
}

function printDownloadUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts download <task_id> --video <path> [--json]`);
}

function printRunUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts run --prompt "text" --video output.mp4 [options]

Options: same as submit, plus:
  --poll-interval <seconds> Task status poll interval (default: 10)
  --max-wait <seconds>      Max wait time for task (default: 1800)`);
}

function parseArgs(argv: string[]): { command: string; args: CliArgs; taskId: string | null } {
  const out: CliArgs = {
    prompt: null,
    promptFiles: [],
    videoPath: null,
    imagePaths: [],
    videoPaths: [],
    audioPaths: [],
    model: null,
    duration: null,
    width: null,
    height: null,
    fps: null,
    seed: null,
    aspectRatio: null,
    resolution: null,
    cameraFixed: false,
    watermark: false,
    generateAudio: false,
    returnLastFrame: false,
    serviceTier: null,
    draft: false,
    frames: null,
    n: 1,
    json: false,
    help: false,
    pollInterval: 10,
    maxWait: 1800,
  };

  let command = "run";
  let taskId: string | null = null;

  // First argument may be a command
  if (argv.length > 0) {
    const first = argv[0]!;
    if (first === "submit" || first === "status" || first === "download" || first === "run") {
      command = first;
      argv = argv.slice(1);
    }
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--json") { out.json = true; continue; }
    if (a === "--camera-fixed") { out.cameraFixed = true; continue; }
    if (a === "--watermark") { out.watermark = true; continue; }
    if (a === "--generate-audio") { out.generateAudio = true; continue; }
    if (a === "--return-last-frame") { out.returnLastFrame = true; continue; }
    if (a === "--draft") { out.draft = true; continue; }

    if (a === "--prompt" || a === "-p") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
      continue;
    }

    if (a === "--promptfiles") {
      const items: string[] = [];
      let j = i + 1;
      while (j < argv.length && !argv[j]!.startsWith("-")) { items.push(argv[j]!); j++; }
      if (items.length === 0) throw new Error("Missing files for --promptfiles");
      out.promptFiles.push(...items);
      i = j - 1;
      continue;
    }

    if (a === "--video") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --video");
      out.videoPath = v;
      continue;
    }

    if (a === "--image") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --image");
      out.imagePaths.push(v);
      continue;
    }

    if (a === "--ref-video") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --ref-video");
      out.videoPaths.push(v);
      continue;
    }

    if (a === "--ref-audio") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --ref-audio");
      out.audioPaths.push(v);
      continue;
    }

    if (a === "--model" || a === "-m") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.model = v;
      continue;
    }

    if (a === "--duration") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --duration");
      out.duration = parseFloat(v);
      if (isNaN(out.duration) || out.duration <= 0) throw new Error(`Invalid duration: ${v}`);
      continue;
    }

    if (a === "--width") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --width");
      out.width = parseInt(v, 10);
      if (isNaN(out.width) || out.width <= 0) throw new Error(`Invalid width: ${v}`);
      continue;
    }

    if (a === "--height") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --height");
      out.height = parseInt(v, 10);
      if (isNaN(out.height) || out.height <= 0) throw new Error(`Invalid height: ${v}`);
      continue;
    }

    if (a === "--fps") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --fps");
      out.fps = parseInt(v, 10);
      if (isNaN(out.fps) || out.fps <= 0) throw new Error(`Invalid fps: ${v}`);
      continue;
    }

    if (a === "--seed") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --seed");
      out.seed = parseInt(v, 10);
      if (isNaN(out.seed)) throw new Error(`Invalid seed: ${v}`);
      continue;
    }

    if (a === "--ar") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --ar");
      out.aspectRatio = v;
      continue;
    }

    if (a === "--resolution") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --resolution");
      out.resolution = v;
      continue;
    }

    if (a === "--service-tier") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --service-tier");
      out.serviceTier = v;
      continue;
    }

    if (a === "--frames") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --frames");
      out.frames = parseInt(v, 10);
      if (isNaN(out.frames) || out.frames <= 0) throw new Error(`Invalid frames: ${v}`);
      continue;
    }

    if (a === "--n") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --n");
      out.n = parseInt(v, 10);
      if (isNaN(out.n) || out.n < 1) throw new Error(`Invalid count: ${v}`);
      continue;
    }

    if (a === "--poll-interval") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --poll-interval");
      out.pollInterval = parseInt(v, 10);
      if (isNaN(out.pollInterval) || out.pollInterval < 1) throw new Error(`Invalid poll interval: ${v}`);
      continue;
    }

    if (a === "--max-wait") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --max-wait");
      out.maxWait = parseInt(v, 10);
      if (isNaN(out.maxWait) || out.maxWait < 1) throw new Error(`Invalid max wait: ${v}`);
      continue;
    }

    if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);

    // For status/download commands, first positional arg is task_id
    if ((command === "status" || command === "download") && !taskId) {
      taskId = a;
      continue;
    }

    if (!out.prompt) out.prompt = a;
  }

  return { command, args: out, taskId };
}

async function loadEnvFile(p: string): Promise<Record<string, string>> {
  try {
    const content = await readFile(p, "utf8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function loadEnv(): Promise<void> {
  const cwd = process.cwd();
  const cwdEnv = await loadEnvFile(path.join(cwd, ".env"));
  for (const [k, v] of Object.entries(cwdEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

function buildConfig(): EnvConfig {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.DEFAULT_VIDEO_GEN_MODEL;

  if (!apiKey) throw new Error("ARK_API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_VIDEO_GEN_MODEL is required in .env");

  return {
    baseUrl: "https://ark.cn-beijing.volces.com",
    apiKey,
    model,
  };
}

async function readPromptFromFiles(files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const f of files) {
    parts.push(await readFile(f, "utf8"));
  }
  return parts.join("\n\n");
}

async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  try {
    const t = await Bun.stdin.text();
    const v = t.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function normalizeOutputVideoPath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.mp4`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".png") return "image/png";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".m4a") return "audio/mp4";
  return "application/octet-stream";
}

async function fileToDataUrl(filePath: string): Promise<string> {
  const fullPath = path.resolve(filePath);
  try {
    await access(fullPath);
  } catch {
    throw new Error(`File not found: ${fullPath}`);
  }
  const bytes = await readFile(fullPath);
  const mimeType = getMimeType(filePath);
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

async function resolveMediaUrl(filePath: string): Promise<string> {
  if (isUrl(filePath)) return filePath;
  return fileToDataUrl(filePath);
}

async function buildContentArray(
  prompt: string,
  imagePaths: string[],
  videoPaths: string[],
  audioPaths: string[],
): Promise<ContentItem[]> {
  const content: ContentItem[] = [];

  content.push({ type: "text", text: prompt });

  for (const imgPath of imagePaths) {
    const url = await resolveMediaUrl(imgPath);
    content.push({
      type: "image_url",
      image_url: { url },
      role: "reference_image",
    });
  }

  for (const vidPath of videoPaths) {
    const url = await resolveMediaUrl(vidPath);
    content.push({
      type: "video_url",
      video_url: { url },
      role: "reference_video",
    });
  }

  for (const audPath of audioPaths) {
    const url = await resolveMediaUrl(audPath);
    content.push({
      type: "audio_url",
      audio_url: { url },
      role: "reference_audio",
    });
  }

  return content;
}

async function submitTask(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const content = await buildContentArray(
    prompt,
    args.imagePaths,
    args.videoPaths,
    args.audioPaths,
  );

  const body: Record<string, unknown> = {
    model,
    content,
  };

  if (args.duration !== null) body.duration = Math.round(args.duration);
  if (args.width !== null) body.width = args.width;
  if (args.height !== null) body.height = args.height;
  if (args.fps !== null) body.fps = args.fps;
  if (args.seed !== null) body.seed = args.seed;
  if (args.n > 1) body.n = args.n;
  if (args.resolution) body.resolution = args.resolution;
  if (args.aspectRatio) body.ratio = args.aspectRatio;
  if (args.cameraFixed) body.camera_fixed = true;
  if (args.watermark) body.watermark = true;
  if (args.generateAudio) body.generate_audio = true;
  if (args.returnLastFrame) body.return_last_frame = true;
  if (args.serviceTier) body.service_tier = args.serviceTier;
  if (args.draft) body.draft = true;
  if (args.frames !== null) body.frames = args.frames;

  console.log(`Submitting video task (${model})...`);

  const res = await fetch(`${baseUrl}/api/v3/contents/generations/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const result = await res.json() as { id: string };
  if (!result.id) throw new Error("No id in response");

  return result.id;
}

function mapUpstreamStatus(status: string): "pending" | "processing" | "succeeded" | "failed" {
  if (status === "pending" || status === "queued") return "pending";
  if (status === "processing" || status === "running") return "processing";
  if (status === "succeeded") return "succeeded";
  return "failed";
}

async function queryTask(
  taskId: string,
  config: EnvConfig,
): Promise<{
  status: "pending" | "processing" | "succeeded" | "failed";
  url?: string;
  metadata?: {
    duration?: number;
    fps?: number;
    width?: number;
    height?: number;
    seed?: number;
  };
  error?: { code: string; message: string };
}> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const res = await fetch(`${baseUrl}/api/v3/contents/generations/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Query error (${res.status}): ${err}`);
  }

  const data = await res.json() as UpstreamQueryResponse;
  const status = mapUpstreamStatus(data.status);

  const result: {
    status: "pending" | "processing" | "succeeded" | "failed";
    url?: string;
    metadata?: {
      duration?: number;
      fps?: number;
      width?: number;
      height?: number;
      seed?: number;
    };
    error?: { code: string; message: string };
  } = { status };

  if (status === "succeeded" && data.content?.video_url) {
    result.url = data.content.video_url;
    result.metadata = {
      duration: data.duration,
      fps: data.framespersecond,
      seed: data.seed,
    };
  }

  if (status === "failed" && data.error) {
    result.error = {
      code: data.error.code || "unknown",
      message: data.error.message || "Unknown error",
    };
  }

  return result;
}

async function downloadVideo(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function pollTask(
  taskId: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<{ url: string; metadata?: { duration?: number; fps?: number; width?: number; height?: number; seed?: number } }> {
  const startTime = Date.now();
  const maxWaitMs = args.maxWait * 1000;
  const pollIntervalMs = args.pollInterval * 1000;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWaitMs) {
      throw new Error(`Task timeout after ${args.maxWait}s. Task ID: ${taskId}`);
    }

    const result = await queryTask(taskId, config);

    if (result.status === "succeeded") {
      if (!result.url) throw new Error("Task succeeded but no URL returned");
      return { url: result.url, metadata: result.metadata };
    }

    if (result.status === "failed") {
      const errorMsg = result.error?.message || "Unknown error";
      const errorCode = result.error?.code || "unknown";
      throw new Error(`Task failed (code: ${errorCode}): ${errorMsg}`);
    }

    const statusText = result.status === "pending" ? "pending" : "processing";
    console.log(`Task ${taskId} is ${statusText}... (${Math.round(elapsed / 1000)}s elapsed)`);

    await sleep(pollIntervalMs);
  }
}

async function doSubmit(args: CliArgs, config: EnvConfig): Promise<void> {
  let prompt: string | null = args.prompt;
  if (!prompt && args.promptFiles.length > 0) prompt = await readPromptFromFiles(args.promptFiles);
  if (!prompt) prompt = await readPromptFromStdin();

  if (!prompt) {
    console.error("Error: Prompt is required");
    printSubmitUsage();
    process.exitCode = 1;
    return;
  }

  const model = args.model || config.model;

  let taskId: string;
  let retried = false;
  while (true) {
    try {
      taskId = await submitTask(prompt, model, args, config);
      break;
    } catch (e) {
      if (!retried) {
        retried = true;
        console.error("Submission failed, retrying...");
        continue;
      }
      throw e;
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ taskId, model, status: "submitted" }, null, 2));
  } else {
    console.log(taskId);
  }
}

async function doStatus(taskId: string, args: CliArgs, config: EnvConfig): Promise<void> {
  const result = await queryTask(taskId, config);

  if (args.json) {
    console.log(JSON.stringify({
      taskId,
      status: result.status,
      url: result.url || null,
      metadata: result.metadata || null,
      error: result.error || null,
    }, null, 2));
  } else {
    console.log(`Status: ${result.status}`);
    if (result.url) {
      console.log(`URL: ${result.url}`);
    }
    if (result.metadata) {
      const m = result.metadata;
      if (m.duration) console.log(`Duration: ${m.duration}s`);
      if (m.fps) console.log(`FPS: ${m.fps}`);
      if (m.seed) console.log(`Seed: ${m.seed}`);
    }
    if (result.error) {
      console.log(`Error: [${result.error.code}] ${result.error.message}`);
    }
  }
}

async function doDownload(taskId: string, args: CliArgs, config: EnvConfig): Promise<void> {
  if (!args.videoPath) {
    console.error("Error: --video is required");
    printDownloadUsage();
    process.exitCode = 1;
    return;
  }

  const result = await queryTask(taskId, config);

  if (result.status !== "succeeded") {
    console.error(`Error: Task status is "${result.status}", cannot download. Wait until status is "succeeded"."`);
    process.exitCode = 1;
    return;
  }

  if (!result.url) {
    console.error("Error: Task succeeded but no URL returned");
    process.exitCode = 1;
    return;
  }

  const outputPath = normalizeOutputVideoPath(args.videoPath);
  console.log("Downloading video...");
  const videoData = await downloadVideo(result.url);

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, videoData);

  if (args.json) {
    console.log(JSON.stringify({
      savedVideo: outputPath,
      taskId,
      metadata: result.metadata,
    }, null, 2));
  } else {
    console.log(outputPath);
  }
}

async function doRun(args: CliArgs, config: EnvConfig): Promise<void> {
  let prompt: string | null = args.prompt;
  if (!prompt && args.promptFiles.length > 0) prompt = await readPromptFromFiles(args.promptFiles);
  if (!prompt) prompt = await readPromptFromStdin();

  if (!prompt) {
    console.error("Error: Prompt is required");
    printRunUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.videoPath) {
    console.error("Error: --video is required");
    printRunUsage();
    process.exitCode = 1;
    return;
  }

  const model = args.model || config.model;
  const outputPath = normalizeOutputVideoPath(args.videoPath);

  let taskId: string;
  let retried = false;
  while (true) {
    try {
      taskId = await submitTask(prompt, model, args, config);
      break;
    } catch (e) {
      if (!retried) {
        retried = true;
        console.error("Submission failed, retrying...");
        continue;
      }
      throw e;
    }
  }

  console.log(`Task submitted: ${taskId}`);

  const result = await pollTask(taskId, args, config);

  console.log("Downloading video...");
  const videoData = await downloadVideo(result.url);

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, videoData);

  if (args.json) {
    console.log(JSON.stringify({
      savedVideo: outputPath,
      model,
      prompt: prompt.slice(0, 200),
      taskId,
      metadata: result.metadata,
    }, null, 2));
  } else {
    console.log(outputPath);
  }
}

async function main(): Promise<void> {
  const { command, args, taskId } = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  await loadEnv();
  const config = buildConfig();

  switch (command) {
    case "submit":
      await doSubmit(args, config);
      break;
    case "status":
      if (!taskId) {
        console.error("Error: task_id is required");
        printStatusUsage();
        process.exitCode = 1;
        return;
      }
      await doStatus(taskId, args, config);
      break;
    case "download":
      if (!taskId) {
        console.error("Error: task_id is required");
        printDownloadUsage();
        process.exitCode = 1;
        return;
      }
      await doDownload(taskId, args, config);
      break;
    case "run":
    default:
      await doRun(args, config);
      break;
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
