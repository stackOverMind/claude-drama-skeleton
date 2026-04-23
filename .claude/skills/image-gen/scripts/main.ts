import path from "node:path";
import process from "node:process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type { CliArgs, EnvConfig } from "./types";

function printUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/main.ts --prompt "一只猫" --image cat.png

Options:
  -p, --prompt <text>       Prompt text
  --promptfiles <files...>  Read prompt from files (concatenated)
  --image <path>            Output image path (required)
  -m, --model <id>          Model ID (default: from .env)
  --ar <ratio>              Aspect ratio (e.g., 16:9, 1:1, 4:3)
  --size <WxH>              Size (e.g., 1024x1024)
  --quality normal|2k       Quality preset (default: 2k)
  --ref <files...>          Reference images for image-to-image editing
  --n <count>               Number of images (default: 1)
  --json                    JSON output
  -h, --help                Show help

Configuration:
  Reads from project .env file:
    NEW_API_BASE_URL         API base URL
    API_KEY                  API key
    DEFAULT_IMAGE_GEN_MODEL  Model ID`);
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    prompt: null,
    promptFiles: [],
    imagePath: null,
    model: null,
    aspectRatio: null,
    size: null,
    quality: null,
    referenceImages: [],
    n: 1,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--json") { out.json = true; continue; }

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

    if (a === "--image") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --image");
      out.imagePath = v;
      continue;
    }

    if (a === "--model" || a === "-m") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.model = v;
      continue;
    }

    if (a === "--ar") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --ar");
      out.aspectRatio = v;
      continue;
    }

    if (a === "--size") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --size");
      out.size = v;
      continue;
    }

    if (a === "--quality") {
      const v = argv[++i];
      if (v !== "normal" && v !== "2k") throw new Error(`Invalid quality: ${v}`);
      out.quality = v;
      continue;
    }

    if (a === "--ref" || a === "--reference") {
      const items: string[] = [];
      let j = i + 1;
      while (j < argv.length && !argv[j]!.startsWith("-")) { items.push(argv[j]!); j++; }
      if (items.length === 0) throw new Error(`Missing files for ${a}`);
      out.referenceImages.push(...items);
      i = j - 1;
      continue;
    }

    if (a === "--n") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --n");
      out.n = parseInt(v, 10);
      if (isNaN(out.n) || out.n < 1) throw new Error(`Invalid count: ${v}`);
      continue;
    }

    if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);

    if (!out.prompt) out.prompt = a;
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

  // Load from project root .env
  const cwdEnv = await loadEnvFile(path.join(cwd, ".env"));

  for (const [k, v] of Object.entries(cwdEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

function buildConfig(): EnvConfig {
  const baseUrl = process.env.NEW_API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const model = process.env.DEFAULT_IMAGE_GEN_MODEL;

  if (!baseUrl) throw new Error("NEW_API_BASE_URL is required in .env");
  if (!apiKey) throw new Error("API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_IMAGE_GEN_MODEL is required in .env");

  return { baseUrl, apiKey, model };
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

function normalizeOutputImagePath(p: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}.png`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  await loadEnv();
  const config = buildConfig();

  if (!args.quality) args.quality = "2k";

  let prompt: string | null = args.prompt;
  if (!prompt && args.promptFiles.length > 0) prompt = await readPromptFromFiles(args.promptFiles);
  if (!prompt) prompt = await readPromptFromStdin();

  if (!prompt) {
    console.error("Error: Prompt is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!args.imagePath) {
    console.error("Error: --image is required");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const model = args.model || config.model;
  const outputPath = normalizeOutputImagePath(args.imagePath);

  for (const refPath of args.referenceImages) {
    const fullPath = path.resolve(refPath);
    try {
      await access(fullPath);
    } catch {
      console.error(`Error: Reference image not found: ${fullPath}`);
      process.exitCode = 1;
      return;
    }
  }

  const { generateImage, editImage } = await import("./providers/doubao");

  let imageData: Uint8Array;
  let retried = false;

  while (true) {
    try {
      if (args.referenceImages.length > 0) {
        imageData = await editImage(prompt, model, args, config);
      } else {
        imageData = await generateImage(prompt, model, args, config);
      }
      break;
    } catch (e) {
      if (!retried) {
        retried = true;
        console.error("Generation failed, retrying...");
        continue;
      }
      throw e;
    }
  }

  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, imageData);

  if (args.json) {
    console.log(JSON.stringify({ savedImage: outputPath, model, prompt: prompt.slice(0, 200) }, null, 2));
  } else {
    console.log(outputPath);
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
