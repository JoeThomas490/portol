import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import type { Original, PhotoStorage } from "./create-thumbnails";

export type R2Credentials = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

/** Reads R2 credentials from the environment; null if any are missing. */
export function r2CredentialsFromEnv(
  env: Record<string, string | undefined>,
): R2Credentials | null {
  const accountId = env.R2_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket: env.R2_BUCKET || "portol-assets",
  };
}

function stripQuotes(etag: string): string {
  return etag.replace(/^"|"$/g, "");
}

export function createR2Storage(credentials: R2Credentials): PhotoStorage {
  const { accountId, accessKeyId, secretAccessKey, bucket } = credentials;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return {
    async listOriginals(prefix) {
      const originals: Original[] = [];
      let continuationToken: string | undefined;

      do {
        const response: ListObjectsV2CommandOutput = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `${prefix}/`,
            ContinuationToken: continuationToken,
          }),
        );

        for (const object of response.Contents ?? []) {
          if (!object.Key || !object.ETag) continue;
          originals.push({ key: object.Key, etag: stripQuotes(object.ETag) });
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return originals;
    },

    async readOriginal(key) {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!response.Body) throw new Error(`R2 object ${key} has no body`);
      return response.Body.transformToByteArray();
    },

    async readThumbnailMetadata(key) {
      try {
        const response = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return response.Metadata ?? {};
      } catch (error) {
        if (
          error instanceof S3ServiceException &&
          error.$metadata.httpStatusCode === 404
        ) {
          return null;
        }
        throw error;
      }
    },

    async uploadThumbnail(thumbnail) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnail.key,
          Body: thumbnail.body,
          Metadata: thumbnail.metadata,
          CacheControl: thumbnail.cacheControl,
          ContentType: thumbnail.contentType,
        }),
      );
    },
  };
}
