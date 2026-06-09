import path from "node:path";
import process from "node:process";
import { access, mkdir, writeFile } from "node:fs/promises";
import type { CliArgs, ImageProvider, Provider } from "./types";
import { loadEnv } from "../common/env";
import { readPromptFromFiles, readPromptFromStdin } from "../common/prompt";
import { normalizeOutputPath } from "../common/path-utils";

function printUsage(): void {
  console.log(`Usage:
  npx -y bun scripts/image/main.ts --prompt "一只猫" --image cat.png

Options:
  -p, --prompt <text>       Prompt text
  --promptfile <files...>   Read prompt from files (concatenated)
  --image <path>            Output image path (required)
  -m, --model <id>          Model ID (default: from .env)
  --ar <ratio>              Aspect ratio (e.g., 16:9, 1:1, 4:3)
  --size <WxH>              Size (e.g., 1024x1024)
  --quality normal|1k|2k|3k    Quality preset (default: 2k)
  --ref <files...>          Reference images for image-to-image editing
  --n <count>               Number of images (default: 1)
  --timeout <seconds>       Request timeout (default: 1200)
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
    timeout: 1200,
    json: false,
    help: false,
    provider: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--json") { out.json = true; continue; }

    if (a === "--provider") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --provider");
      if (v !== "newapi") throw new Error(`Invalid provider: ${v}. Only newapi is supported.`);
      out.provider = v;
      continue;
    }

    if (a === "--prompt" || a === "-p") {
      const v = argv[++i];
      if (!v) throw new Error(`Missing value for ${a}`);
      out.prompt = v;
      continue;
    }

    if (a === "--promptfile") {
      const items: string[] = [];
      let j = i + 1;
      while (j < argv.length && !argv[j]!.startsWith("-")) { items.push(argv[j]!); j++; }
      if (items.length === 0) throw new Error("Missing files for --promptfile");
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
      if (v !== "normal" && v !== "1k" && v !== "2k" && v !== "3k") throw new Error(`Invalid quality: ${v}`);
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

    if (a === "--timeout") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --timeout");
      out.timeout = parseInt(v, 10);
      if (isNaN(out.timeout) || out.timeout < 1) throw new Error(`Invalid timeout: ${v}`);
      continue;
    }

    if (a.startsWith("-")) throw new Error(`Unknown option: ${a}`);

    if (!out.prompt) out.prompt = a;
  }

  return out;
}

async function loadProvider(name: Provider): Promise<ImageProvider> {
  const mod = await import(`./providers/${name}`);
  return { buildConfig: mod.buildConfig, generateImage: mod.generateImage, editImage: mod.editImage };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  await loadEnv();

  const providerName = args.provider || "newapi";
  const provider = await loadProvider(providerName);
  const config = provider.buildConfig();

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
  const outputPath = normalizeOutputPath(args.imagePath, ".png");

  // Prevent overwriting existing files
  try {
    await access(outputPath);
    console.error(`Error: Output file already exists: ${outputPath}`);
    process.exitCode = 1;
    return;
  } catch {
    // File does not exist, safe to proceed
  }

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

  let imageData: Uint8Array;

  if (args.referenceImages.length > 0) {
    imageData = await provider.editImage(prompt, model, args, config);
  } else {
    imageData = await provider.generateImage(prompt, model, args, config);
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
