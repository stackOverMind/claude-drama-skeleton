import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import type { CliArgs, EnvConfig, QueryResponse, VideoProvider } from "../types";
import { getMimeType } from "../../common/mime";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildConfig(): EnvConfig {
  const apiKey = process.env.COOL_API_KEY;
  const model = process.env.DEFAULT_VIDEO_GEN_MODEL;

  if (!apiKey) throw new Error("COOL_API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_VIDEO_GEN_MODEL is required in .env");

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

async function buildFiles(
  args: CliArgs,
  config: EnvConfig,
): Promise<Array<{ url: string; type: string }>> {
  const files: Array<{ url: string; type: string }> = [];

  for (const imgPath of args.imagePaths) {
    const url = await resolveFileUrl(imgPath, config);
    files.push({ url, type: "image" });
  }

  for (const vidPath of args.videoPaths) {
    const url = await resolveFileUrl(vidPath, config);
    files.push({ url, type: "video" });
  }

  for (const audPath of args.audioPaths) {
    const url = await resolveFileUrl(audPath, config);
    files.push({ url, type: "audio" });
  }

  return files;
}

async function submitTask(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    model,
  };

  if (args.aspectRatio) body.ratio = args.aspectRatio;
  if (args.duration !== null) body.duration = Math.round(args.duration);

  const files = await buildFiles(args, config);
  if (files.length > 0) body.files = files;

  console.log(`Submitting video task via Cool API (${model})...`);

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

function mapCoolStatus(status: string): "pending" | "processing" | "succeeded" | "failed" {
  if (status === "pending") return "pending";
  if (status === "running") return "processing";
  if (status === "success") return "succeeded";
  return "failed";
}

async function queryTask(
  taskId: string,
  config: EnvConfig,
): Promise<QueryResponse> {
  const res = await fetch(`${config.baseUrl}/v1/cool/task/${taskId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Query error (${res.status}): ${err}`);
  }

  const data = await res.json() as {
    task_id: string;
    status: string;
    result?: {
      url?: string;
      duration?: number;
      resolution?: string;
    };
    error?: string | null;
  };

  const result: QueryResponse = {
    task_id: taskId,
    status: mapCoolStatus(data.status),
  };

  if (data.status === "success" && data.result?.url) {
    result.url = data.result.url;
    result.metadata = {
      duration: data.result.duration ?? undefined,
    };
  }

  if (data.status === "failed" && data.error) {
    result.error = { code: "failed", message: data.error };
  }

  return result;
}

export const coolProvider: VideoProvider = {
  buildConfig,
  submitTask,
  queryTask,
};
