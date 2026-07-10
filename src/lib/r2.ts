import {
  ListObjectsV2Command,
  S3Client,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import {
  CLOUDFLARE_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_ACCOUNT_ID,
  R2_BUCKET,
  R2_PUBLIC_URL,
  R2_SECRET_ACCESS_KEY,
} from "astro:env/server";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);

function getR2Config() {
  const accountId = R2_ACCOUNT_ID ?? CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = R2_ACCESS_KEY_ID;
  const secretAccessKey = R2_SECRET_ACCESS_KEY;
  const bucket = R2_BUCKET;
  const publicUrl = R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    if (import.meta.env.DEV) {
      console.warn(
        "[photography] R2 credentials missing — collections will be empty in dev. Copy .env.example to .env and add your R2 API token.",
      );
      return null;
    }

    throw new Error(
      "R2 credentials missing. Set R2_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID), R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment.",
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function createR2Client() {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2 is not configured");
  }

  const { accountId, accessKeyId, secretAccessKey } = config;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function normalizePrefix(prefix: string): string {
  return prefix.replace(/^\/+/, "").replace(/\/+$/, "");
}

function isImageKey(key: string): boolean {
  const filename = key.split("/").pop() ?? "";
  if (!filename || filename.startsWith(".")) return false;

  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
}

function filenameToAlt(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

export type R2Image = {
  src: string;
  alt: string;
  filename: string;
};

export async function listR2Images(prefix: string): Promise<R2Image[]> {
  const config = getR2Config();
  if (!config) return [];

  const { bucket, publicUrl } = config;
  const client = createR2Client();
  const normalizedPrefix = normalizePrefix(prefix);
  const listPrefix = normalizedPrefix ? `${normalizedPrefix}/` : "";

  const images: R2Image[] = [];
  let continuationToken: string | undefined;

  do {
    const response: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: listPrefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || !isImageKey(object.Key)) continue;

      const filename = object.Key.split("/").pop()!;
      images.push({
        src: `${publicUrl.replace(/\/+$/, "")}/${object.Key}`,
        alt: filenameToAlt(filename),
        filename,
      });
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return images.sort((a, b) =>
    a.filename.localeCompare(b.filename, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}
