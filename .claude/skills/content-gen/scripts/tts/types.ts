export type TtsMode = "preset" | "design" | "clone";
export type AudioFormat = "wav" | "mp3" | "pcm16" | "opus";
export type Provider = "mimo" | "new-api";

export type CliArgs = {
  text: string | null;
  textFile: string | null;
  audioPath: string | null;
  mode: TtsMode;
  voice: string | null;
  style: string | null;
  styleFile: string | null;
  model: string | null;
  format: AudioFormat;
  provider: Provider;
  json: boolean;
  help: boolean;
};

export type EnvConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: Provider;
};
