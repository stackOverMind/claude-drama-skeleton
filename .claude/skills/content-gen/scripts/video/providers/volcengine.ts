import process from "node:process";
import type { CliArgs, ContentItem, EnvConfig, QueryResponse, VideoProvider } from "../types";
import { resolveMediaUrl } from "../../common/path-utils";

type UpstreamQueryResponse = {
  id: string;
  model: string;
  status: string;
  content?: {
    video_url?: string;
  };
  seed?: number;
  resolution?: string;
  duration?: number;
  ratio?: string;
  framespersecond?: number;
  service_tier?: string;
  usage?: {
    completion_tokens: number;
    total_tokens: number;
    tool_usage: Record<string, number>;
  };
  error?: {
    code: string;
    message: string;
  };
  created_at: number;
  updated_at: number;
};

function mapUpstreamStatus(status: string): "pending" | "processing" | "succeeded" | "failed" {
  if (status === "pending" || status === "queued") return "pending";
  if (status === "processing" || status === "running") return "processing";
  if (status === "succeeded") return "succeeded";
  return "failed";
}

function buildConfig(): EnvConfig {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.DEFAULT_VIDEO_GEN_MODEL;

  if (!apiKey) throw new Error("ARK_API_KEY is required in .env");
  if (!model) throw new Error("DEFAULT_VIDEO_GEN_MODEL is required in .env");

  return {
    baseUrl: "https://ark.cn-beijing.volces.com",
    apiKey,
    model,
  };
}

async function buildContentArray(
  prompt: string,
  imagePaths: string[],
  videoPaths: string[],
  audioPaths: string[],
): Promise<ContentItem[]> {
  const content: ContentItem[] = [];

  content.push({ type: "text", text: prompt });

  for (const imgPath of imagePaths) {
    const url = await resolveMediaUrl(imgPath);
    content.push({
      type: "image_url",
      image_url: { url },
      role: "reference_image",
    });
  }

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

  const content = await buildContentArray(
    prompt,
    args.imagePaths,
    args.videoPaths,
    args.audioPaths,
  );

  const body: Record<string, unknown> = {
    model,
    content,
  };

  if (args.duration !== null) body.duration = Math.round(args.duration);
  if (args.width !== null) body.width = args.width;
  if (args.height !== null) body.height = args.height;
  if (args.fps !== null) body.fps = args.fps;
  if (args.seed !== null) body.seed = args.seed;
  if (args.n > 1) body.n = args.n;
  if (args.resolution) body.resolution = args.resolution;
  if (args.aspectRatio) body.ratio = args.aspectRatio;
  if (args.cameraFixed) body.camera_fixed = true;
  if (args.watermark) body.watermark = true;
  body.generate_audio = true;
  if (args.returnLastFrame) body.return_last_frame = true;
  if (args.serviceTier) body.service_tier = args.serviceTier;
  if (args.draft) body.draft = true;
  if (args.frames !== null) body.frames = args.frames;

  console.log(`Submitting video task (${model})...`);

  const res = await fetch(`${baseUrl}/api/v3/contents/generations/tasks`, {
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

  const result = await res.json() as { id: string };
  if (!result.id) throw new Error("No id in response");

  return result.id;
}

async function queryTask(
  taskId: string,
  config: EnvConfig,
): Promise<QueryResponse> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const res = await fetch(`${baseUrl}/api/v3/contents/generations/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Query error (${res.status}): ${err}`);
  }

  const data = await res.json() as UpstreamQueryResponse;
  const status = mapUpstreamStatus(data.status);

  const result: QueryResponse = { task_id: taskId, status };

  if (status === "succeeded" && data.content?.video_url) {
    result.url = data.content.video_url;
    result.metadata = {
      duration: data.duration,
      fps: data.framespersecond,
      seed: data.seed,
    };
  }

  if (status === "failed" && data.error) {
    result.error = {
      code: data.error.code || "unknown",
      message: data.error.message || "Unknown error",
    };
  }

  return result;
}

export const volcengineProvider: VideoProvider = {
  buildConfig,
  submitTask,
  queryTask,
};
