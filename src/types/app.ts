export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export const ClassLabel = {
  A: 0,
  B: 1,
} as const;

export type ClassLabel = (typeof ClassLabel)[keyof typeof ClassLabel];

export type Sample = {
  x: number;
  y: number;
  label: ClassLabel;
};

export type Dataset = Array<Sample>;
