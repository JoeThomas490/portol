import type { PhotoCollection } from "./photography";

export type GridPlacement = {
  col: number;
  row: number;
  collectionIndex: number;
};

export const GRID_COLUMNS = 6;

// Deterministic scattered pattern across the grid.
// All cells are 1x1. Same layout on every render.
export const GRID_PLACEMENTS: GridPlacement[] = [
  { col: 1, row: 1, collectionIndex: 0 },
  { col: 2, row: 1, collectionIndex: 1 },
  { col: 6, row: 1, collectionIndex: 2 },
  { col: 3, row: 2, collectionIndex: 3 },
  { col: 4, row: 2, collectionIndex: 4 },
  { col: 2, row: 3, collectionIndex: 5 },
  { col: 6, row: 3, collectionIndex: 6 },
];

// Synthetic collections used to pad the grid up to GRID_PLACEMENTS.length.
// Photos are borrowed from real collections in a round-robin so cells still
// have images to cycle when only a few real collections exist.
const DUMMY_META: { name: string; date: Date }[] = [
  { name: "Coast 2019", date: new Date("2019-08-14") },
  { name: "Winter Light", date: new Date("2021-01-22") },
  { name: "Field Notes", date: new Date("2022-05-03") },
  { name: "Kyoto Nights", date: new Date("2023-11-09") },
  { name: "Backroads", date: new Date("2020-06-27") },
  { name: "Studio Tests", date: new Date("2024-02-11") },
  { name: "Long Exposure", date: new Date("2022-09-30") },
  { name: "Alpine Drift", date: new Date("2018-12-05") },
  { name: "Analog Diary", date: new Date("2023-04-18") },
  { name: "Lagoons", date: new Date("2021-07-08") },
  { name: "City Grain", date: new Date("2019-03-16") },
  { name: "Sunday Walk", date: new Date("2024-10-06") },
];

export function getGridCollections(
  real: PhotoCollection[],
): PhotoCollection[] {
  const needed = Math.max(
    ...GRID_PLACEMENTS.map((p) => p.collectionIndex),
  ) + 1;

  const collections: PhotoCollection[] = [...real];

  let dummyIndex = 0;
  let borrowIndex = 0;
  while (collections.length < needed) {
    const meta = DUMMY_META[dummyIndex % DUMMY_META.length];
    const donor = real.length > 0 ? real[borrowIndex % real.length] : undefined;

    collections.push({
      name: meta.name,
      date: meta.date,
      photos: donor?.photos ?? [],
    });

    dummyIndex += 1;
    borrowIndex += 1;
  }

  return collections;
}
