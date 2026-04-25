export type CliArgs = {
  prompt: string | null;
  promptFiles: string[];
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

export type SubmitResponse = {
  id: string;
};

export type UpstreamQueryResponse = {
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

// new-api wraps response in { code, message, data: {...} }
export type NewApiQueryResponse = {
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
