export type Provider = "volcengine" | "newapi" | "cool";

export type CliArgs = {
  prompt: string | null;
  videoPath: string | null;
  imagePaths: string[];
  videoPaths: string[];
  audioPaths: string[];
  model: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  seed: number | null;
  aspectRatio: string | null;
  resolution: string | null;
  cameraFixed: boolean;
  watermark: boolean;
  generateAudio: boolean;
  returnLastFrame: boolean;
  serviceTier: string | null;
  draft: boolean;
  frames: number | null;
  n: number;
  json: boolean;
  help: boolean;
  pollInterval: number;
  maxWait: number;
  provider: Provider | null;
};

export type EnvConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role?: string }
  | { type: "video_url"; video_url: { url: string }; role?: string }
  | { type: "audio_url"; audio_url: { url: string }; role?: string };

export type TaskStatus = "pending" | "processing" | "succeeded" | "failed";

export type QueryResponse = {
  task_id: string;
  status: TaskStatus;
  url?: string;
  format?: string;
  metadata?: {
    duration?: number;
    fps?: number;
    width?: number;
    height?: number;
    seed?: number;
  };
  error?: {
    code: string;
    message: string;
  };
};

export type VideoProvider = {
  buildConfig(): EnvConfig;
  submitTask(prompt: string, model: string, args: CliArgs, config: EnvConfig): Promise<string>;
  queryTask(taskId: string, config: EnvConfig): Promise<QueryResponse>;
};
