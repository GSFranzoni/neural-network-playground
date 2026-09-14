import type { Bounds } from "@/types/app";

export const bounds: Bounds = {
  minX: -6,
  maxX: 6,
  minY: -6,
  maxY: 6,
};

export const coordinateScale = Math.max(
  Math.abs(bounds.minX),
  Math.abs(bounds.maxX),
  Math.abs(bounds.minY),
  Math.abs(bounds.maxY),
);
