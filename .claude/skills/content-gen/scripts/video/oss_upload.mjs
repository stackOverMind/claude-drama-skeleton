import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import path from "node:path";

const REGION = process.env.ALIYUN_OSS_REGION || "oss-cn-wulanchabu";
const BUCKET = process.env.ALIYUN_OSS_BUCKET || "xgy1";
const ACCESS_KEY = process.env.ALIYUN_ACCESS_KEY_ID;
const SECRET_KEY = process.env.ALIYUN_ACCESS_KEY_SECRET;
const BASE_PATH = process.env.ALIYUN_OSS_BASE_PATH || "ootd";

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("Missing ALIYUN_ACCESS_KEY_ID or ALIYUN_ACCESS_KEY_SECRET");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node oss_upload.mjs <file>");
  process.exit(1);
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".avi") return "video/x-msvideo";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".m4a") return "audio/mp4";
  return "application/octet-stream";
}

const bytes = await readFile(filePath);
const filename = path.basename(filePath);
const objectKey = `${BASE_PATH}/${Date.now()}_${filename}`;
const contentType = getMimeType(filePath);
const date = new Date().toUTCString();

const canonicalizedResource = `/${BUCKET}/${objectKey}`;
const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedResource}`;
const signature = createHmac("sha1", SECRET_KEY).update(stringToSign).digest("base64");
const auth = `OSS ${ACCESS_KEY}:${signature}`;

const url = `https://${BUCKET}.${REGION}.aliyuncs.com/${objectKey}`;

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
  console.error(`Upload failed (${res.status}): ${text}`);
  process.exit(1);
}

console.log(url);
