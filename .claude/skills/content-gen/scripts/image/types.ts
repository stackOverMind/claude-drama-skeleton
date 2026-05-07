export type Provider = "newapi" | "cool";

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
  timeout: number;
  json: boolean;
  help: boolean;
  provider: Provider | null;
};

export type EnvConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ImageProvider = {
  buildConfig(): EnvConfig;
  generateImage(prompt: string, model: string, args: CliArgs, config: EnvConfig): Promise<Uint8Array>;
  editImage(prompt: string, model: string, args: CliArgs, config: EnvConfig): Promise<Uint8Array>;
};
