import path from "node:path";
import { readFile } from "node:fs/promises";
import { getMimeType } from "./mime";

export function normalizeOutputPath(p: string, defaultExt: string): string {
  const full = path.resolve(p);
  const ext = path.extname(full);
  if (ext) return full;
  return `${full}${defaultExt}`;
}

export function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

export async function fileToDataUrl(filePath: string): Promise<string> {
  const fullPath = path.resolve(filePath);
  const bytes = await readFile(fullPath);
  const mimeType = getMimeType(filePath);
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

export async function resolveMediaUrl(filePath: string): Promise<string> {
  if (isUrl(filePath)) return filePath;
  return fileToDataUrl(filePath);
}
