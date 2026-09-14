import { bounds } from "@/lib/bounds";
import { ClassLabel, type Dataset } from "@/types/app";

const DATASET_SCALE = 6;

function random(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function normal(next: () => number): number {
  const u = Math.max(next(), Number.MIN_VALUE);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
}

function clamp(value: number): number {
  return Math.max(bounds.minX, Math.min(bounds.maxX, value));
}

function point(x: number, y: number, label: ClassLabel) {
  return { x: clamp(x * DATASET_SCALE), y: clamp(y * DATASET_SCALE), label };
}

function circle(seed: number): Dataset {
  const next = random(seed);
  return Array.from({ length: 320 }, () => {
    const angle = next() * Math.PI * 2;
    const label = next() > 0.5 ? ClassLabel.B : ClassLabel.A;
    const radius = label === ClassLabel.B ? Math.sqrt(next()) * 0.4 : 0.6 + next() * 0.3;
    return point(Math.cos(angle) * radius, Math.sin(angle) * radius, label);
  });
}

function exclusiveOr(seed: number): Dataset {
  const next = random(seed);
  return Array.from({ length: 240 }, () => {
    const x = (next() < 0.5 ? -1 : 1) * (0.05 + next() * 0.9);
    const y = (next() < 0.5 ? -1 : 1) * (0.05 + next() * 0.9);
    return point(x, y, x * y >= 0 ? ClassLabel.B : ClassLabel.A);
  });
}

function gaussian(seed: number): Dataset {
  const next = random(seed);
  return Array.from({ length: 320 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const center = label === ClassLabel.A ? -0.3 : 0.3;
    return point(center + normal(next) * 0.12, center + normal(next) * 0.12, label);
  });
}

function twoMoons(seed: number): Dataset {
  const next = random(seed);
  return Array.from({ length: 240 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const angle = next() * Math.PI;
    const noise = normal(next) * 0.03;
    return label === ClassLabel.A
      ? point((Math.cos(angle) - 0.5) * 0.6 + noise, (Math.sin(angle) - 0.25) * 0.6 + noise, label)
      : point((0.5 - Math.cos(angle)) * 0.6 + noise, (0.25 - Math.sin(angle)) * 0.6 + noise, label);
  });
}

function spiral(seed: number): Dataset {
  const next = random(seed);
  const pointsPerClass = 150;

  return Array.from({ length: pointsPerClass * 2 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const progress = Math.floor(index / 2) / (pointsPerClass - 1);
    const radius = 0.06 + progress * 0.84;
    const angle = 0.9 + (1 - progress) * Math.PI * 3 + label * Math.PI;
    return point(
      radius * Math.cos(angle) + normal(next) * 0.012,
      radius * Math.sin(angle) + normal(next) * 0.012,
      label,
    );
  });
}

export const datasets = (noise: number, seed = 0) => ({
  circle: addNoise(circle(seed + 1), noise, seed),
  exclusiveOr: addNoise(exclusiveOr(seed + 2), noise, seed),
  gaussian: addNoise(gaussian(seed + 3), noise, seed),
  twoMoons: addNoise(twoMoons(seed + 4), noise, seed),
  spiral: addNoise(spiral(seed + 5), noise, seed),
});

function addNoise(dataset: Dataset, noise: number, seed: number) {
  if (noise <= 0) {
    return dataset;
  }

  const amount = noise / 100;

  return dataset.map((point, pointIndex) => {
    const next = random(seed + 1100 + pointIndex);

    return {
      ...point,
      x: clamp(point.x + normal(next) * amount),
      y: clamp(point.y + normal(next) * amount),
    };
  });
}
