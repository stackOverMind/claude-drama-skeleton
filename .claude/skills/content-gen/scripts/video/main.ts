import path from "node:path";
import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import type { CliArgs, EnvConfig, Provider, VideoProvider } from "./types";
import { loadEnv } from "../common/env";
import { readPromptFromStdin } from "../common/prompt";
import { normalizeOutputPath } from "../common/path-utils";

function printUsage(): void {
  console.log(`Usage:
  # Step 1: Submit task (returns task_id immediately)
  npx -y bun scripts/video/main.ts submit --prompt "一只猫在花园里弹钢琴" [--image cat.jpg] [--ref-video source.mp4]

  # Step 2: Check task status
  npx -y bun scripts/video/main.ts status <task_id>

  # Step 3: Download video when status is SUCCESS
  npx -y bun scripts/video/main.ts download <task_id> --video output.mp4

  # One-shot mode (legacy): submit + poll + download
  npx -y bun scripts/video/main.ts run --prompt "一只猫在花园里弹钢琴" --video cat-piano.mp4

Provider Selection:
  --provider <name>         volcengine or newapi (default: auto-detect)
                            volcengine: uses ARK_API_KEY, calls ark.cn-beijing.volces.com
                            newapi: uses NEW_API_BASE_URL + API_KEY, OpenAI-compatible

Submit Options:
  -p, --prompt <text>       Prompt text
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
    ARK_API_KEY              VolcEngine API key (for volcengine provider)
    NEW_API_BASE_URL         API base URL (for newapi provider)
    API_KEY                  API key (for newapi provider)
    DEFAULT_VIDEO_GEN_MODEL  Model ID`);
}

function printSubmitUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/video/main.ts submit --prompt "text" [--image img.jpg] [--ref-video vid.mp4] [--ref-audio aud.mp3] [options]

Options:
  -p, --prompt <text>       Prompt text
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
  npx -y bun scripts/video/main.ts status <task_id> [--json]`);
}

function printDownloadUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/video/main.ts download <task_id> --video <path> [--poll-interval N] [--max-wait N]

  Polls task status until succeeded, then downloads the video.`);
}

function printRunUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/video/main.ts run --prompt "text" --video output.mp4 [options]

Options: same as submit, plus:
  --poll-interval <seconds> Task status poll interval (default: 10)
  --max-wait <seconds>      Max wait time for task (default: 1800)`);
}

function parseArgs(argv: string[]): { command: string; args: CliArgs; taskId: string | null } {
  const out: CliArgs = {
    prompt: null,
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
    provider: null,
  };

  let command = "run";
  let taskId: string | null = null;

  // Find command in argv (may not be at index 0 if --provider precedes it)
  const commands = ["submit", "status", "download", "run"];
  const cmdIdx = argv.findIndex((a) => commands.includes(a));
  if (cmdIdx >= 0) {
    command = argv[cmdIdx]!;
    argv = [...argv.slice(0, cmdIdx), ...argv.slice(cmdIdx + 1)];
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

    if (a === "--provider") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --provider");
      if (v !== "volcengine" && v !== "newapi") throw new Error(`Invalid provider: ${v}. Use volcengine or newapi.`);
      out.provider = v;
      continue;
    }

    if (a === "--prompt" || a === "-p") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
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

    if ((command === "status" || command === "download") && !taskId) {
      taskId = a;
      continue;
    }

    if (!out.prompt) out.prompt = a;
  }

  return { command, args: out, taskId };
}

async function detectProvider(): Promise<Provider> {
  if (process.env.ARK_API_KEY) return "volcengine";
  return "newapi";
}

async function loadProvider(name: Provider): Promise<VideoProvider> {
  if (name === "volcengine") {
    const mod = await import("./providers/volcengine");
    return mod.volcengineProvider;
  }
  const mod = await import("./providers/newapi");
  return mod.newapiProvider;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTask(
  taskId: string,
  args: CliArgs,
  provider: VideoProvider,
  config: EnvConfig,
): Promise<{ url: string; metadata?: import("./types").QueryResponse["metadata"] }> {
  const startTime = Date.now();
  const maxWaitMs = args.maxWait * 1000;
  const pollIntervalMs = args.pollInterval * 1000;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWaitMs) {
      throw new Error(`Task timeout after ${args.maxWait}s. Task ID: ${taskId}`);
    }

    const result = await provider.queryTask(taskId, config);

    if (result.status === "succeeded") {
      if (!result.url) throw new Error("Task succeeded but no URL returned");
      return { url: result.url, metadata: result.metadata };
    }

    if (result.status === "failed" || result.error) {
      const errorMsg = result.error?.message || "Unknown error";
      const errorCode = result.error?.code || "unknown";
      throw new Error(`Task failed (code: ${errorCode}): ${errorMsg}`);
    }

    const statusText = result.status === "pending" ? "pending" : "processing";
    console.log(`Task ${taskId} is ${statusText}... (${Math.round(elapsed / 1000)}s elapsed)`);

    await sleep(pollIntervalMs);
  }
}

async function downloadVideo(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function doSubmit(args: CliArgs, provider: VideoProvider, config: EnvConfig): Promise<void> {
  let prompt: string | null = args.prompt;
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
      taskId = await provider.submitTask(prompt, model, args, config);
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

async function doStatus(taskId: string, args: CliArgs, provider: VideoProvider, config: EnvConfig): Promise<void> {
  const result = await provider.queryTask(taskId, config);

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

async function doDownload(taskId: string, args: CliArgs, provider: VideoProvider, config: EnvConfig): Promise<void> {
  if (!args.videoPath) {
    console.error("Error: --video is required");
    printDownloadUsage();
    process.exitCode = 1;
    return;
  }

  const result = await pollTask(taskId, args, provider, config);

  const outputPath = normalizeOutputPath(args.videoPath, ".mp4");
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

async function doRun(args: CliArgs, provider: VideoProvider, config: EnvConfig): Promise<void> {
  let prompt: string | null = args.prompt;
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
  const outputPath = normalizeOutputPath(args.videoPath, ".mp4");

  let taskId: string;
  let retried = false;
  while (true) {
    try {
      taskId = await provider.submitTask(prompt, model, args, config);
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

  const result = await pollTask(taskId, args, provider, config);

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

  const providerName = args.provider || await detectProvider();
  console.log(`Using provider: ${providerName}`);

  const provider = await loadProvider(providerName);
  const config = provider.buildConfig();

  switch (command) {
    case "submit":
      await doSubmit(args, provider, config);
      break;
    case "status":
      if (!taskId) {
        console.error("Error: task_id is required");
        printStatusUsage();
        process.exitCode = 1;
        return;
      }
      await doStatus(taskId, args, provider, config);
      break;
    case "download":
      if (!taskId) {
        console.error("Error: task_id is required");
        printDownloadUsage();
        process.exitCode = 1;
        return;
      }
      await doDownload(taskId, args, provider, config);
      break;
    case "run":
    default:
      await doRun(args, provider, config);
      break;
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
