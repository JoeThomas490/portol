import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { sharpResizer } from "./sharp-resizer";

async function jpeg(width: number, height: number): Promise<Uint8Array> {
  return sharp({
    create: { width, height, channels: 3, background: "#808080" },
  })
    .jpeg()
    .toBuffer();
}

describe("sharpResizer", () => {
  it("makes a WebP with a 480px long edge from a landscape Photo", async () => {
    const output = await sharpResizer.toWebp(await jpeg(3000, 2000), 480);

    const { format, width, height } = await sharp(output).metadata();
    expect(format).toBe("webp");
    expect([width, height]).toEqual([480, 320]);
  });

  it("makes a WebP with a 480px long edge from a portrait Photo", async () => {
    const output = await sharpResizer.toWebp(await jpeg(2000, 3000), 480);

    const { width, height } = await sharp(output).metadata();
    expect([width, height]).toEqual([320, 480]);
  });

  it("fails on bytes that aren't an image", async () => {
    await expect(
      sharpResizer.toWebp(new TextEncoder().encode("not an image"), 480),
    ).rejects.toThrow();
  });
});
