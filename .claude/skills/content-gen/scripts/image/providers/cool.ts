import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import type { CliArgs, EnvConfig } from "../types";
import { getMimeType } from "../../common/mime";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildConfig(): EnvConfig {
  const apiKey = process.env.COOL_API_KEY;
  const model = process.env.DEFAULT_IMAGE_GEN_MODEL;

  if (!apiKey) throw new Error("COOL_API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_IMAGE_GEN_MODEL is required in .env");

  return {
    baseUrl: process.env.COOL_BASE_URL || "https://api.mjapi.cc.cd",
    apiKey,
    model,
  };
}

async function uploadLocalFile(filePath: string, config: EnvConfig): Promise<string> {
  const fullPath = path.resolve(filePath);
  const bytes = await readFile(fullPath);
  const filename = path.basename(filePath);
  const mimeType = getMimeType(filePath);

  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: mimeType }), filename);

  const res = await fetch(`${config.baseUrl}/v1/cool/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload error (${res.status}): ${err}`);
  }

  const result = await res.json() as { file_url: string };
  return result.file_url;
}

async function resolveFileUrl(filePath: string, config: EnvConfig): Promise<string> {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  return uploadLocalFile(filePath, config);
}

async function submitGenerateTask(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
  files?: Array<{ url: string; type: string }>,
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    model,
  };

  if (args.aspectRatio) body.ratio = args.aspectRatio;
  if (files && files.length > 0) body.files = files;

  console.log(`Submitting image task via Cool API (${model})...`);

  const res = await fetch(`${config.baseUrl}/v1/cool/generate`, {
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

  const result = await res.json() as { task_id: string };
  if (!result.task_id) throw new Error("No task_id in response");

  return result.task_id;
}

async function pollUntilDone(
  taskId: string,
  config: EnvConfig,
  timeoutSec: number,
): Promise<string> {
  const startTime = Date.now();
  const maxWaitMs = timeoutSec * 1000;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxWaitMs) {
      throw new Error(`Task timeout after ${timeoutSec}s. Task ID: ${taskId}`);
    }

    const res = await fetch(`${config.baseUrl}/v1/cool/task/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Query error (${res.status}): ${err}`);
    }

    const data = await res.json() as {
      status: string;
      result?: { url: string };
      error?: string | null;
    };

    if (data.status === "success") {
      if (!data.result?.url) throw new Error("Task succeeded but no URL returned");
      return data.result.url;
    }

    if (data.status === "failed") {
      throw new Error(`Task failed: ${data.error || "Unknown error"}`);
    }

    console.log(`Task ${taskId} is ${data.status}... (${Math.round(elapsed / 1000)}s elapsed)`);
    await sleep(5000);
  }
}

async function downloadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function generateImage(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<Uint8Array> {
  console.log(`Generating image via Cool API (${model})...`, { ratio: args.aspectRatio || "16:9", timeout: `${args.timeout}s` });

  const taskId = await submitGenerateTask(prompt, model, args, config);
  const url = await pollUntilDone(taskId, config, args.timeout);
  return downloadBytes(url);
}

export async function editImage(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<Uint8Array> {
  console.log(`Editing image via Cool API (${model})...`, { refs: args.referenceImages.length, timeout: `${args.timeout}s` });

  const files: Array<{ url: string; type: string }> = [];
  for (const refPath of args.referenceImages) {
    const url = await resolveFileUrl(refPath, config);
    files.push({ url, type: "image" });
  }

  const taskId = await submitGenerateTask(prompt, model, args, config, files);
  const url = await pollUntilDone(taskId, config, args.timeout);
  return downloadBytes(url);
}
