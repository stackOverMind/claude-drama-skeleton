import path from "node:path";
import process from "node:process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type { CliArgs, EnvConfig, TtsMode, AudioFormat, Provider } from "./types";

function printUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts --text "你好，世界！" --audio hello.wav

Options:
  -t, --text <text>         Text to synthesize (assistant role content)
  --textfile <path>         Read synthesis text from file
  --audio <path>            Output audio path (required)
  --mode <mode>             Mode: preset | design | clone (default: preset)
  --voice <id|desc|path>    Preset voice ID / voice description / audio sample path
  --style <text>            Natural language style instruction (user role content)
  --stylefile <path>        Read style instruction from file
  -m, --model <id>          Model ID (default: from .env)
  --format <format>         Audio format: wav | mp3 | pcm16 | opus (default: wav)
  --provider <provider>     API provider: mimo | new-api (default: new-api)
  --json                    JSON output
  -h, --help                Show help

Configuration:
  Reads from project .env file:
    MIMO_API_KEY            MiMo API key (required)
    MIMO_BASE_URL           API base URL (default: https://api.xiaomimimo.com/v1)
    DEFAULT_TTS_MODEL       Default model ID (default: mimo-v2.5-tts)
    TTS_PROVIDER            Default provider: mimo | new-api (default: new-api)

Modes:
  preset  - Use built-in voices (mimo-v2.5-tts)
  design  - Design voice from text description (mimo-v2.5-tts-voicedesign)
  clone   - Clone voice from audio sample (mimo-v2.5-tts-voiceclone)`);
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    text: null,
    textFile: null,
    audioPath: null,
    mode: "preset",
    voice: null,
    style: null,
    styleFile: null,
    model: null,
    format: "wav",
    provider: "new-api",
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--json") { out.json = true; continue; }

    if (a === "--text" || a === "-t") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.text = v;
      continue;
    }

    if (a === "--textfile") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --textfile");
      out.textFile = v;
      continue;
    }

    if (a === "--audio") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --audio");
      out.audioPath = v;
      continue;
    }

    if (a === "--mode") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --mode");
      if (v !== "preset" && v !== "design" && v !== "clone") {
        throw new Error(`Invalid mode: ${v}. Must be preset, design, or clone`);
      }
      out.mode = v as TtsMode;
      continue;
    }

    if (a === "--voice") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --voice");
      out.voice = v;
      continue;
    }

    if (a === "--style") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --style");
      out.style = v;
      continue;
    }

    if (a === "--stylefile") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --stylefile");
      out.styleFile = v;
      continue;
    }

    if (a === "--model" || a === "-m") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.model = v;
      continue;
    }

    if (a === "--format") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --format");
      if (v !== "wav" && v !== "mp3" && v !== "pcm16" && v !== "opus") {
        throw new Error(`Invalid format: ${v}. Must be wav, mp3, pcm16, or opus`);
      }
      out.format = v as AudioFormat;
      continue;
    }

    if (a === "--provider") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --provider");
      if (v !== "mimo" && v !== "new-api") {
        throw new Error(`Invalid provider: ${v}. Must be mimo or new-api`);
      }
      out.provider = v as Provider;
      continue;
    }

    if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);

    if (!out.text) out.text = a;
  }

  return out;
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

function buildConfig(args: CliArgs): EnvConfig {
  const baseUrl = process.env.MIMO_BASE_URL || "https://api.xiaomimimo.com/v1";
  const apiKey = process.env.MIMO_API_KEY;
  const model = process.env.DEFAULT_TTS_MODEL || "mimo-v2.5-tts";
  const provider = (process.env.TTS_PROVIDER as Provider) || args.provider || "new-api";

  if (!apiKey) throw new Error("MIMO_API_KEY is required in .env or environment");

  return { baseUrl, apiKey, model, provider };
}

function getModelForMode(mode: TtsMode, fallback: string): string {
  if (mode === "design") return "mimo-v2.5-tts-voicedesign";
  if (mode === "clone") return "mimo-v2.5-tts-voiceclone";
  return fallback;
}

async function readTextFromFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

async function readTextFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  try {
    const t = await Bun.stdin.text();
    const v = t.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function normalizeOutputAudioPath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.wav`;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  return "audio/mpeg";
}

async function encodeAudioToBase64(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  const mimeType = getMimeType(filePath);
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  await loadEnv();
  const config = buildConfig(args);

  let text: string | null = args.text;
  if (!text && args.textFile) text = await readTextFromFile(args.textFile);
  if (!text) text = await readTextFromStdin();

  if (!text) {
    console.error("Error: --text or --textfile is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.audioPath) {
    console.error("Error: --audio is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  let style: string | null = args.style;
  if (!style && args.styleFile) style = await readTextFromFile(args.styleFile);

  const model = args.model || getModelForMode(args.mode, config.model);
  const outputPath = normalizeOutputAudioPath(args.audioPath);

  // Validate clone mode requirements
  if (args.mode === "clone") {
    if (!args.voice) {
      console.error("Error: --voice (audio sample path) is required in clone mode");
      printUsage();
      process.exitCode = 1;
      return;
    }
    const voicePath = path.resolve(args.voice);
    try {
      await access(voicePath);
    } catch {
      console.error(`Error: Audio sample not found: ${voicePath}`);
      process.exitCode = 1;
      return;
    }
  }

  // Validate design mode: style (voice description) is required for design mode
  if (args.mode === "design" && !args.voice) {
    console.error("Error: --voice (voice description) is required in design mode");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const { synthesize } = await import("./tts");

  let audioData: Uint8Array;
  let retried = false;

  while (true) {
    try {
      audioData = await synthesize(text, model, args, config, style);
      break;
    } catch (e) {
      if (!retried) {
        retried = true;
        console.error("Synthesis failed, retrying...");
        continue;
      }
      throw e;
    }
  }

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, audioData);

  if (args.json) {
    console.log(JSON.stringify({ savedAudio: outputPath, model, mode: args.mode, format: args.format }, null, 2));
  } else {
    console.log(outputPath);
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
