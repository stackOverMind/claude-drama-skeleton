import process from "node:process";
import { readFile } from "node:fs/promises";

export async function readPromptFromFiles(files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const f of files) {
    parts.push(await readFile(f, "utf8"));
  }
  return parts.join("\n\n");
}

export async function readPromptFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  try {
    const t = await Bun.stdin.text();
    const v = t.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export async function readPromptFromMarkdownFile(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf8");
  let body = content;

  if (content.startsWith("---\n")) {
    const endIdx = content.indexOf("\n---", 4);
    if (endIdx !== -1) {
      body = content.slice(endIdx + 4);
    }
  }

  return body.replace(/^\s+/, "");
}
