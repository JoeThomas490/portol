import sharp from "sharp";
import type { Resizer } from "./resized-copies";

export const sharpResizer: Resizer = {
  async toWebp(input, longEdge) {
    return sharp(input)
      // Apply EXIF orientation so portrait Photos stay upright.
      .rotate()
      .resize({ width: longEdge, height: longEdge, fit: "inside" })
      .webp()
      .toBuffer();
  },
};
