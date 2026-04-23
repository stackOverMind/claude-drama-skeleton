export type Quality = "normal" | "2k";

export type CliArgs = {
  prompt: string | null;
  promptFiles: string[];
  imagePath: string | null;
  model: string | null;
  aspectRatio: string | null;
  size: string | null;
  quality: Quality | null;
  referenceImages: string[];
  n: number;
  json: boolean;
  help: boolean;
};

export type EnvConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};
