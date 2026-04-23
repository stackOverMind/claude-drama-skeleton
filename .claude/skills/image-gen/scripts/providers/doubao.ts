import path from "node:path";
import { readFile } from "node:fs/promises";
import type { CliArgs, EnvConfig } from "../types";

function parseAspectRatio(ar: string): { width: number; height: number } | null {
  const match = ar.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const w = parseFloat(match[1]!);
  const h = parseFloat(match[2]!);
  if (w <= 0 || h <= 0) return null;
  return { width: w, height: h };
}

function getSizeFromAspectRatio(ar: string | null, quality: CliArgs["quality"]): string {
  const baseSize = quality === "2k" ? 2048 : 1024;

  if (!ar) return `${baseSize}x${baseSize}`;

  const parsed = parseAspectRatio(ar);
  if (!parsed) return `${baseSize}x${baseSize}`;

  const ratio = parsed.width / parsed.height;

  if (Math.abs(ratio - 1) < 0.1) return `${baseSize}x${baseSize}`;

  if (ratio > 1) {
    const w = Math.round(baseSize * ratio);
    return `${w}x${baseSize}`;
  }

  const h = Math.round(baseSize / ratio);
  return `${baseSize}x${h}`;
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

  console.log(`Generating image (${model})...`, { size });

  const res = await fetch(`${baseUrl}/v1/images/generations`, {
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

  const result = await res.json() as {
    data: Array<{ url?: string; b64_json?: string }>;
  };

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

export async function editImage(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<Uint8Array> {
  const baseUrl = config.baseUrl.replace(/\/+$/g, "");
  const size = args.size || getSizeFromAspectRatio(args.aspectRatio, args.quality);

  // Encode reference images as base64 data URIs
  const imageUrls: string[] = [];
  for (const refPath of args.referenceImages) {
    const bytes = await readFile(refPath);
    const mimeType = getMimeType(refPath);
    const b64 = Buffer.from(bytes).toString("base64");
    imageUrls.push(`data:${mimeType};base64,${b64}`);
  }

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: args.n,
    image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
  };

  const url = `${baseUrl}/v1/images/edits`;

  console.log(`Editing image (${model})...`, { size, refs: args.referenceImages.length });

  const res = await fetch(url, {
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

  const result = await res.json() as {
    data: Array<{ url?: string; b64_json?: string }>;
  };

  return extractImageBytes(result);
}
