import { describe, expect, it } from "vitest";
import {
  createThumbnails,
  type ThumbnailUpload,
  type PhotoStorage,
  type Resizer,
} from "./create-thumbnails";

type StoredObject = {
  body: Uint8Array;
  etag: string;
  metadata: Record<string, string>;
  cacheControl?: string;
  contentType?: string;
};

class FakeBucket implements PhotoStorage {
  objects = new Map<string, StoredObject>();
  uploads = 0;
  private nextEtag = 1;

  putOriginal(key: string, contents: string): string {
    const etag = `etag-${this.nextEtag++}`;
    this.objects.set(key, {
      body: new TextEncoder().encode(contents),
      etag,
      metadata: {},
    });
    return etag;
  }

  async listOriginals(prefix: string) {
    return [...this.objects.entries()]
      .filter(([key]) => key.startsWith(`${prefix}/`))
      .map(([key, object]) => ({ key, etag: object.etag }));
  }

  async readOriginal(key: string) {
    const object = this.objects.get(key);
    if (!object) throw new Error(`No such object: ${key}`);
    return object.body;
  }

  async readThumbnailMetadata(key: string) {
    return this.objects.get(key)?.metadata ?? null;
  }

  async uploadThumbnail(thumbnail: ThumbnailUpload) {
    this.uploads++;
    this.objects.set(thumbnail.key, {
      body: thumbnail.body,
      etag: `etag-${this.nextEtag++}`,
      metadata: thumbnail.metadata,
      cacheControl: thumbnail.cacheControl,
      contentType: thumbnail.contentType,
    });
  }

  text(key: string): string | undefined {
    const object = this.objects.get(key);
    return object && new TextDecoder().decode(object.body);
  }
}

const stubResizer: Resizer = {
  async toWebp(input, longEdge) {
    return new TextEncoder().encode(
      `webp@${longEdge}:${new TextDecoder().decode(input)}`,
    );
  },
};

describe("createThumbnails", () => {
  it("gives an Album Tile's Photo without a Thumbnail a 480px WebP one at the mirrored path", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createThumbnails({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa"],
    });

    expect(bucket.text("thumbs/480/photography/tessa/01.webp")).toBe(
      "webp@480:tessa-01",
    );
  });

  it("stores the original's ETag on the Thumbnail and caches it for a day", async () => {
    const bucket = new FakeBucket();
    const etag = bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createThumbnails({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa"],
    });

    const thumbnail = bucket.objects.get("thumbs/480/photography/tessa/01.webp");
    expect(thumbnail?.metadata).toEqual({ "source-etag": etag });
    expect(thumbnail?.cacheControl).toBe("public, max-age=86400");
    expect(thumbnail?.contentType).toBe("image/webp");
  });

  it("uploads nothing on a second run in a row", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");
    bucket.putOriginal("photography/wales/01.jpg", "wales-01");
    const run = () =>
      createThumbnails({
        storage: bucket,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa", "photography/wales"],
      });

    await run();
    const uploadsAfterFirstRun = bucket.uploads;
    await run();

    expect(uploadsAfterFirstRun).toBe(2);
    expect(bucket.uploads).toBe(2);
  });

  it("regenerates a Thumbnail when its original was replaced under the same name", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "old tessa");
    const run = () =>
      createThumbnails({
        storage: bucket,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      });
    await run();

    const newEtag = bucket.putOriginal("photography/tessa/01.jpg", "new tessa");
    await run();

    const thumbnailKey = "thumbs/480/photography/tessa/01.webp";
    expect(bucket.text(thumbnailKey)).toBe("webp@480:new tessa");
    expect(bucket.objects.get(thumbnailKey)?.metadata).toEqual({
      "source-etag": newEtag,
    });
  });

  it("fails when a resize fails", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");
    const brokenResizer: Resizer = {
      async toWebp() {
        throw new Error("corrupt JPEG");
      },
    };

    await expect(
      createThumbnails({
        storage: bucket,
        resizer: brokenResizer,
        albumPrefixes: ["photography/tessa"],
      }),
    ).rejects.toThrow("corrupt JPEG");
    expect(bucket.uploads).toBe(0);
  });

  it("fails when an upload fails", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");
    bucket.uploadThumbnail = async () => {
      throw new Error("403 Forbidden");
    };

    await expect(
      createThumbnails({
        storage: bucket,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      }),
    ).rejects.toThrow("403 Forbidden");
  });

  it("uploads nothing when there are no Albums", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createThumbnails({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: [],
    });

    expect(bucket.uploads).toBe(0);
  });

  it("does nothing without R2 credentials", async () => {
    await expect(
      createThumbnails({
        storage: null,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      }),
    ).resolves.toEqual([]);
  });

  it("gives a Thumbnail only to each Album Tile's Photo, the first by filename", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/10.jpg", "tessa-10");
    bucket.putOriginal("photography/tessa/2.jpg", "tessa-2");
    bucket.putOriginal("photography/tessa/notes.txt", "not a photo");
    bucket.putOriginal("photography/wales/b.png", "wales-b");
    bucket.putOriginal("photography/wales/a.png", "wales-a");

    await createThumbnails({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa", "photography/wales"],
    });

    const thumbnails = [...bucket.objects.keys()].filter((key) =>
      key.startsWith("thumbs/"),
    );
    expect(thumbnails.sort()).toEqual([
      "thumbs/480/photography/tessa/2.webp",
      "thumbs/480/photography/wales/a.webp",
    ]);
  });
});
