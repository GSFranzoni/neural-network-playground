import type { Bounds } from "@/types/app";

export type ScalarField = {
  values: number[][];
};

export function sampleField(
  bounds: Bounds,
  resolution: number,
  sample: (x: number, y: number) => number,
): ScalarField {
  return {
    values: Array.from({ length: resolution }, (_, row) => {
      const y = bounds.maxY - ((row + 0.5) / resolution) * (bounds.maxY - bounds.minY);

      return Array.from({ length: resolution }, (_, column) => {
        const x = bounds.minX + ((column + 0.5) / resolution) * (bounds.maxX - bounds.minX);
        return sample(x, y);
      });
    }),
  };
}
