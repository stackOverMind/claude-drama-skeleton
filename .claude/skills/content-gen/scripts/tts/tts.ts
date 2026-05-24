import path from "node:path";
import { readFile } from "node:fs/promises";
import type { CliArgs, EnvConfig } from "./types";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  return "audio/mpeg";
}

async function encodeAudioToBase64(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  const mimeType = getMimeType(filePath);
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

function buildMessages(
  text: string,
  mode: CliArgs["mode"],
  voice: string | null,
  style: string | null,
): Array<{ role: "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (mode === "preset") {
    // preset: user message is optional style instruction
    if (style) {
      messages.push({ role: "user", content: style });
    }
    messages.push({ role: "assistant", content: text });
  } else if (mode === "design") {
    // design: user message is required voice description
    messages.push({ role: "user", content: voice || "" });
    messages.push({ role: "assistant", content: text });
  } else if (mode === "clone") {
    // clone: user message is optional style instruction
    if (style) {
      messages.push({ role: "user", content: style });
    } else {
      messages.push({ role: "user", content: "" });
    }
    messages.push({ role: "assistant", content: text });
  }

  return messages;
}

function buildAudioConfig(
  mode: CliArgs["mode"],
  voice: string | null,
  format: CliArgs["format"],
): Record<string, unknown> {
  const audio: Record<string, unknown> = {
    format,
  };

  if (mode === "preset" && voice) {
    audio.voice = voice;
  }

  return audio;
}

export async function synthesize(
  text: string,
  model: string,
  args: CliArgs,
  config: EnvConfig,
  style: string | null,
): Promise<Uint8Array> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  const messages = buildMessages(text, args.mode, args.voice, style);
  const audio = buildAudioConfig(args.mode, args.voice, args.format);

  // For clone mode, encode audio sample into voice field
  if (args.mode === "clone" && args.voice) {
    const voiceB64 = await encodeAudioToBase64(args.voice);
    audio.voice = voiceB64;
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    audio,
  };

  console.log(`Synthesizing speech (${model}, mode=${args.mode}, format=${args.format})...`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.provider === "new-api") {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  } else {
    headers["api-key"] = config.apiKey;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const result = await res.json() as {
    choices?: Array<{
      message?: {
        audio?: {
          data?: string;
        };
      };
    }>;
  };

  const audioData = result.choices?.[0]?.message?.audio?.data;
  if (!audioData) {
    throw new Error("No audio data in response");
  }

  return Uint8Array.from(Buffer.from(audioData, "base64"));
}
