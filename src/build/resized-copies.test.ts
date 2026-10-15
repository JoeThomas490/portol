import { describe, expect, it } from "vitest";
import {
  createResizedCopies,
  type CopyUpload,
  type PhotoStorage,
  type Resizer,
} from "./resized-copies";

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

  async readCopyMetadata(key: string) {
    return this.objects.get(key)?.metadata ?? null;
  }

  async uploadCopy(copy: CopyUpload) {
    this.uploads++;
    this.objects.set(copy.key, {
      body: copy.body,
      etag: `etag-${this.nextEtag++}`,
      metadata: copy.metadata,
      cacheControl: copy.cacheControl,
      contentType: copy.contentType,
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

describe("createResizedCopies", () => {
  it("gives an Album Tile's Photo without a copy a 480px WebP copy at the mirrored path", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createResizedCopies({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa"],
    });

    expect(bucket.text("thumbs/480/photography/tessa/01.webp")).toBe(
      "webp@480:tessa-01",
    );
  });

  it("stores the original's ETag on the copy and caches it for a day", async () => {
    const bucket = new FakeBucket();
    const etag = bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createResizedCopies({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa"],
    });

    const copy = bucket.objects.get("thumbs/480/photography/tessa/01.webp");
    expect(copy?.metadata).toEqual({ "source-etag": etag });
    expect(copy?.cacheControl).toBe("public, max-age=86400");
    expect(copy?.contentType).toBe("image/webp");
  });

  it("uploads nothing on a second run in a row", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");
    bucket.putOriginal("photography/wales/01.jpg", "wales-01");
    const run = () =>
      createResizedCopies({
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

  it("regenerates a copy when its original was replaced under the same name", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "old tessa");
    const run = () =>
      createResizedCopies({
        storage: bucket,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      });
    await run();

    const newEtag = bucket.putOriginal("photography/tessa/01.jpg", "new tessa");
    await run();

    const copyKey = "thumbs/480/photography/tessa/01.webp";
    expect(bucket.text(copyKey)).toBe("webp@480:new tessa");
    expect(bucket.objects.get(copyKey)?.metadata).toEqual({
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
      createResizedCopies({
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
    bucket.uploadCopy = async () => {
      throw new Error("403 Forbidden");
    };

    await expect(
      createResizedCopies({
        storage: bucket,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      }),
    ).rejects.toThrow("403 Forbidden");
  });

  it("uploads nothing when there are no Albums", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/01.jpg", "tessa-01");

    await createResizedCopies({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: [],
    });

    expect(bucket.uploads).toBe(0);
  });

  it("does nothing without R2 credentials", async () => {
    await expect(
      createResizedCopies({
        storage: null,
        resizer: stubResizer,
        albumPrefixes: ["photography/tessa"],
      }),
    ).resolves.toEqual([]);
  });

  it("copies only each Album Tile's Photo, the first by filename", async () => {
    const bucket = new FakeBucket();
    bucket.putOriginal("photography/tessa/10.jpg", "tessa-10");
    bucket.putOriginal("photography/tessa/2.jpg", "tessa-2");
    bucket.putOriginal("photography/tessa/notes.txt", "not a photo");
    bucket.putOriginal("photography/wales/b.png", "wales-b");
    bucket.putOriginal("photography/wales/a.png", "wales-a");

    await createResizedCopies({
      storage: bucket,
      resizer: stubResizer,
      albumPrefixes: ["photography/tessa", "photography/wales"],
    });

    const copies = [...bucket.objects.keys()].filter((key) =>
      key.startsWith("thumbs/"),
    );
    expect(copies.sort()).toEqual([
      "thumbs/480/photography/tessa/2.webp",
      "thumbs/480/photography/wales/a.webp",
    ]);
  });
});
