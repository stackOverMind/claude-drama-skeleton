import path from "node:path";
import process from "node:process";
import { access, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";

function printUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/extract-audio.ts --input video.mp4 --output audio.wav

Options:
  -i, --input <path>     Input video file (required)
  -o, --output <path>    Output audio file (required)
  --format <format>      Output format: wav | mp3 | aac | flac (default: auto from ext)
  --start <time>         Start time, e.g. 00:01:30 or 90s
  --duration <time>      Duration, e.g. 00:00:10 or 10s
  --sample-rate <rate>   Sample rate: 16000 | 22050 | 44100 | 48000 (default: 44100)
  --channels <n>         Audio channels: 1 | 2 (default: 2)
  -q, --quality <n>      MP3 quality: 0-9, 0=best (default: 2)
  --json                 JSON output
  -h, --help             Show help

Examples:
  # Extract full audio as WAV
  npx -y bun scripts/extract-audio.ts -i video.mp4 -o audio.wav

  # Extract first 10 seconds as MP3
  npx -y bun scripts/extract-audio.ts -i video.mp4 -o audio.mp3 --duration 10

  # Extract segment from 1:30 to 1:40 as 16kHz mono WAV (good for voice clone)
  npx -y bun scripts/extract-audio.ts -i video.mp4 -o segment.wav --start 00:01:30 --duration 10 --sample-rate 16000 --channels 1`);
}

type ExtractArgs = {
  input: string | null;
  output: string | null;
  format: string | null;
  start: string | null;
  duration: string | null;
  sampleRate: number;
  channels: number;
  quality: number;
  json: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): ExtractArgs {
  const out: ExtractArgs = {
    input: null,
    output: null,
    format: null,
    start: null,
    duration: null,
    sampleRate: 44100,
    channels: 2,
    quality: 2,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--json") { out.json = true; continue; }

    if (a === "--input" || a === "-i") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.input = v;
      continue;
    }

    if (a === "--output" || a === "-o") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.output = v;
      continue;
    }

    if (a === "--format") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --format");
      out.format = v;
      continue;
    }

    if (a === "--start") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --start");
      out.start = v;
      continue;
    }

    if (a === "--duration") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --duration");
      out.duration = v;
      continue;
    }

    if (a === "--sample-rate") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --sample-rate");
      out.sampleRate = parseInt(v, 10);
      continue;
    }

    if (a === "--channels") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --channels");
      out.channels = parseInt(v, 10);
      continue;
    }

    if (a === "--quality" || a === "-q") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.quality = parseInt(v, 10);
      continue;
    }

    if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);
  }

  return out;
}

function detectFormat(outputPath: string, explicitFormat: string | null): string {
  if (explicitFormat) return explicitFormat;
  const ext = path.extname(outputPath).toLowerCase().slice(1);
  if (ext) return ext;
  return "wav";
}

function buildFfmpegArgs(args: ExtractArgs, outputFormat: string): string[] {
  const ffmpegArgs: string[] = ["-y"];

  if (args.start) {
    ffmpegArgs.push("-ss", args.start);
  }

  ffmpegArgs.push("-i", args.input!);

  if (args.duration) {
    ffmpegArgs.push("-t", args.duration);
  }

  ffmpegArgs.push("-vn");

  // Audio codec based on format
  switch (outputFormat) {
    case "mp3":
      ffmpegArgs.push("-acodec", "libmp3lame", "-q:a", String(args.quality));
      break;
    case "aac":
      ffmpegArgs.push("-acodec", "aac", "-b:a", "192k");
      break;
    case "flac":
      ffmpegArgs.push("-acodec", "flac");
      break;
    case "wav":
    default:
      ffmpegArgs.push("-acodec", "pcm_s16le");
      break;
  }

  ffmpegArgs.push("-ar", String(args.sampleRate));
  ffmpegArgs.push("-ac", String(args.channels));

  ffmpegArgs.push(args.output!);

  return ffmpegArgs;
}

async function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    proc.on("error", () => resolve(false));
    proc.on("exit", (code) => resolve(code === 0));
  });
}

async function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to run ffmpeg: ${err.message}`));
    });

    proc.on("exit", (code) => {
      if (code !== 0) {
        const lines = stderr.split("\n").filter((l) => l.trim());
        const lastError = lines.slice(-3).join("\n");
        reject(new Error(`ffmpeg exited with code ${code}: ${lastError || stderr}`));
      } else {
        resolve();
      }
    });
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (!args.input) {
    console.error("Error: --input is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.output) {
    console.error("Error: --output is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    console.error("Error: ffmpeg not found. Please install ffmpeg first.");
    console.error("  macOS: brew install ffmpeg");
    console.error("  Ubuntu/Debian: sudo apt install ffmpeg");
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);

  try {
    await access(inputPath);
  } catch {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exitCode = 1;
    return;
  }

  const outputFormat = detectFormat(outputPath, args.format);
  const ffmpegArgs = buildFfmpegArgs(args, outputFormat);

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });

  await runFfmpeg(ffmpegArgs);

  if (args.json) {
    console.log(JSON.stringify({
      input: inputPath,
      output: outputPath,
      format: outputFormat,
      sampleRate: args.sampleRate,
      channels: args.channels,
    }, null, 2));
  } else {
    console.log(outputPath);
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
