import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import path from "node:path";
import { getMimeType } from "./mime";

export function hasOssCredentials(): boolean {
  return !!(process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET);
}

export async function uploadToOss(filePath: string): Promise<string> {
  const region = process.env.ALIYUN_OSS_REGION || "oss-cn-wulanchabu";
  const bucket = process.env.ALIYUN_OSS_BUCKET || "xgy1";
  const accessKey = process.env.ALIYUN_ACCESS_KEY_ID!;
  const secretKey = process.env.ALIYUN_ACCESS_KEY_SECRET!;
  const basePath = process.env.ALIYUN_OSS_BASE_PATH || "ootd";

  const fullPath = path.resolve(filePath);
  const bytes = await readFile(fullPath);
  const filename = path.basename(fullPath);
  const objectKey = `${basePath}/${Date.now()}_${filename}`;
  const contentType = getMimeType(fullPath);

  const date = new Date().toUTCString();
  const canonicalizedResource = `/${bucket}/${objectKey}`;
  const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedResource}`;
  const signature = createHmac("sha1", secretKey).update(stringToSign).digest("base64");
  const auth = `OSS ${accessKey}:${signature}`;

  const url = `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Date": date,
      "Content-Type": contentType,
      "Authorization": auth,
    },
    body: bytes,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OSS upload failed (${res.status}): ${text}`);
  }

  return url;
}
