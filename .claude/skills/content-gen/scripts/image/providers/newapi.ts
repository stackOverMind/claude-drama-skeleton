import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import type { CliArgs, EnvConfig } from "../types";

export function buildConfig(): EnvConfig {
  const baseUrl = process.env.NEW_API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const model = process.env.DEFAULT_IMAGE_GEN_MODEL;

  if (!baseUrl) throw new Error("NEW_API_BASE_URL is required in .env");
  if (!apiKey) throw new Error("API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_IMAGE_GEN_MODEL is required in .env");

  return { baseUrl, apiKey, model };
}

function parseAspectRatio(ar: string): { width: number; height: number } | null {
  const match = ar.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const w = parseFloat(match[1]!);
  const h = parseFloat(match[2]!);
  if (w <= 0 || h <= 0) return null;
  return { width: w, height: h };
}

function roundToMultipleOf16(n: number): number {
  return Math.round(n / 16) * 16;
}

function getSizeFromAspectRatio(ar: string | null, quality: CliArgs["quality"]): string {
  const baseSize = quality === "3k" ? 3072 : quality === "2k" ? 2048 : 1024;

  if (!ar) return `${baseSize}x${baseSize}`;

  const parsed = parseAspectRatio(ar);
  if (!parsed) return `${baseSize}x${baseSize}`;

  const ratio = parsed.width / parsed.height;

  if (Math.abs(ratio - 1) < 0.1) return `${baseSize}x${baseSize}`;

  if (ratio > 1) {
    const w = roundToMultipleOf16(baseSize * ratio);
    return `${w}x${baseSize}`;
  }

  const h = roundToMultipleOf16(baseSize / ratio);
  return `${baseSize}x${h}`;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

async function extractImageBytes(result: { data: Array<{ url?: string; b64_json?: string }> }): Promise<Uint8Array> {
  const img = result.data[0];
  if (!img) throw new Error("No image in response");

  if (img.b64_json) {
    return Uint8Array.from(Buffer.from(img.b64_json, "base64"));
  }

  if (img.url) {
    const imgRes = await fetch(img.url);
    if (!imgRes.ok) throw new Error("Failed to download image");
    const buf = await imgRes.arrayBuffer();
    return new Uint8Array(buf);
  }

  throw new Error("No image data in response");
}

export async function generateImage(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<Uint8Array> {
  const baseUrl = config.baseUrl.replace(/\/+$/g, "");
  const size = args.size || getSizeFromAspectRatio(args.aspectRatio, args.quality);

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: args.n,
  };

  console.log(`Generating image (${model})...`, { size, timeout: `${args.timeout}s` });

  const controller = new AbortController();
  const timeoutMs = args.timeout * 1000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const result = await res.json() as {
    data: Array<{ url?: string; b64_json?: string }>;
  };

  return extractImageBytes(result);
}

export async function editImage(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<Uint8Array> {
  const baseUrl = config.baseUrl.replace(/\/+$/g, "");
  const size = args.size || getSizeFromAspectRatio(args.aspectRatio, args.quality);

  const formData = new FormData();
  formData.append("model", model);
  formData.append("prompt", prompt);
  if (size) formData.append("size", size);
  if (args.n) formData.append("n", String(args.n));

  for (const refPath of args.referenceImages) {
    const bytes = await readFile(refPath);
    const mimeType = getMimeType(refPath);
    const filename = path.basename(refPath);
    formData.append("image", new Blob([bytes], { type: mimeType }), filename);
  }

  const url = `${baseUrl}/v1/images/edits`;

  console.log(`Editing image (${model})...`, { size, refs: args.referenceImages.length, timeout: `${args.timeout}s` });

  const controller = new AbortController();
  const timeoutMs = args.timeout * 1000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const result = await res.json() as {
    data: Array<{ url?: string; b64_json?: string }>;
  };

  return extractImageBytes(result);
}
