import path from "node:path";
import process from "node:process";
import { readFile, access } from "node:fs/promises";

export async function loadEnvFile(p: string): Promise<Record<string, string>> {
  try {
    const content = await readFile(p, "utf8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function findProjectRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  while (true) {
    try {
      await access(path.join(dir, ".env"));
      return dir;
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }
}

export async function loadEnv(): Promise<void> {
  const projectRoot = await findProjectRoot(process.cwd());
  const envPath = projectRoot
    ? path.join(projectRoot, ".env")
    : path.join(process.cwd(), ".env");
  const env = await loadEnvFile(envPath);
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v;
  }
}
