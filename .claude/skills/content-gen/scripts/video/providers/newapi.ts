import process from "node:process";
import type { CliArgs, ContentItem, EnvConfig, QueryResponse, VideoProvider } from "../types";
import { resolveMediaUrl } from "../../common/path-utils";

type NewApiQueryResponse = {
  code: string;
  message: string;
  data: {
    status: string;
    result_url?: string;
    fail_reason?: string;
    data?: {
      content?: {
        video_url?: string;
      };
      duration?: number;
      framespersecond?: number;
      seed?: number;
      resolution?: string;
      ratio?: string;
      status?: string;
    };
  };
};

function mapNewApiStatus(status: string): "pending" | "processing" | "succeeded" | "failed" {
  if (status === "SUCCESS" || status === "succeeded") return "succeeded";
  if (status === "FAILED" || status === "failed") return "failed";
  if (status === "PENDING" || status === "pending" || status === "queued") return "pending";
  return "processing";
}

function buildConfig(): EnvConfig {
  const baseUrl = process.env.NEW_API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const model = process.env.DEFAULT_VIDEO_GEN_MODEL;

  if (!baseUrl) throw new Error("NEW_API_BASE_URL is required in .env");
  if (!apiKey) throw new Error("API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_VIDEO_GEN_MODEL is required in .env");

  return { baseUrl, apiKey, model };
}

async function buildMediaContent(
  videoPaths: string[],
  audioPaths: string[],
): Promise<ContentItem[]> {
  const content: ContentItem[] = [];

  for (const vidPath of videoPaths) {
    const url = await resolveMediaUrl(vidPath);
    content.push({
      type: "video_url",
      video_url: { url },
      role: "reference_video",
    });
  }

  for (const audPath of audioPaths) {
    const url = await resolveMediaUrl(audPath);
    content.push({
      type: "audio_url",
      audio_url: { url },
      role: "reference_audio",
    });
  }

  return content;
}

async function submitTask(
  prompt: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    model,
    prompt,
  };

  if (args.imagePaths.length > 0) {
    body.image = await resolveMediaUrl(args.imagePaths[0]);
  }
  if (args.duration !== null) body.seconds = String(args.duration);
  if (args.width !== null) body.width = args.width;
  if (args.height !== null) body.height = args.height;
  if (args.fps !== null) body.fps = args.fps;
  if (args.seed !== null) body.seed = args.seed;
  if (args.n > 1) body.n = args.n;

  const metadata: Record<string, unknown> = {};
  if (args.resolution) metadata.resolution = args.resolution;
  if (args.aspectRatio) metadata.ratio = args.aspectRatio;
  if (args.cameraFixed) metadata.camera_fixed = true;
  if (args.watermark) metadata.watermark = true;
  if (args.generateAudio) metadata.generate_audio = true;
  if (args.returnLastFrame) metadata.return_last_frame = true;
  if (args.serviceTier) metadata.service_tier = args.serviceTier;
  if (args.draft) metadata.draft = true;
  if (args.frames !== null) metadata.frames = args.frames;

  const mediaContent = await buildMediaContent(args.videoPaths, args.audioPaths);
  if (mediaContent.length > 0) {
    metadata.content = mediaContent;
  }

  if (Object.keys(metadata).length > 0) {
    body.metadata = metadata;
  }

  console.log(`Submitting video task (${model})...`);

  const res = await fetch(`${baseUrl}/v1/video/generations`, {
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

  const result = await res.json() as { task_id: string; status: string };
  if (!result.task_id) throw new Error("No task_id in response");

  return result.task_id;
}

async function queryTask(
  taskId: string,
  config: EnvConfig,
): Promise<QueryResponse> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const res = await fetch(`${baseUrl}/v1/video/generations/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Query error (${res.status}): ${err}`);
  }

  const wrapper = await res.json() as NewApiQueryResponse;
  const data = wrapper.data;

  const result: QueryResponse = {
    task_id: taskId,
    status: mapNewApiStatus(data.status),
  };

  if (data.result_url) {
    result.url = data.result_url;
  }

  if (data.data) {
    const inner = data.data;
    if (inner.content?.video_url && !result.url) {
      result.url = inner.content.video_url;
    }
    result.metadata = {
      duration: inner.duration,
      fps: inner.framespersecond,
      seed: inner.seed,
    };
  }

  if (data.fail_reason) {
    result.error = { code: "failed", message: data.fail_reason };
  }

  return result;
}

export const newapiProvider: VideoProvider = {
  buildConfig,
  submitTask,
  queryTask,
};
