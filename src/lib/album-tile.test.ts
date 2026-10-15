import { describe, expect, it } from "vitest";
import { albumTile } from "./album-tile";

describe("albumTile", () => {
  it("points at the Thumbnail of the Album's first Photo", () => {
    const tile = albumTile(
      [
        { key: "photography/tessa/01.jpg", alt: "Tessa on the beach" },
        { key: "photography/tessa/02.jpg", alt: "Tessa in the dunes" },
      ],
      "https://assets.example.com",
    );

    expect(tile).toEqual({
      src: "https://assets.example.com/thumbs/480/photography/tessa/01.webp",
      alt: "Tessa on the beach",
    });
  });

  it("copes with a trailing slash on the public URL", () => {
    const tile = albumTile(
      [{ key: "photography/wales/a.PNG", alt: "Wales" }],
      "https://assets.example.com/",
    );

    expect(tile?.src).toBe(
      "https://assets.example.com/thumbs/480/photography/wales/a.webp",
    );
  });

  it("has no Tile for an Album without Photos", () => {
    expect(albumTile([], "https://assets.example.com")).toBeNull();
  });
});
