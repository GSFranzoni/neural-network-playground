import { bounds } from "@/lib/bounds";
import { ClassLabel, type Dataset } from "@/types/app";

const DATASET_SCALE = 4;

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

function circle(): Dataset {
  const next = random(1);
  return Array.from({ length: 320 }, () => {
    const angle = next() * Math.PI * 2;
    const label = next() > 0.5 ? ClassLabel.B : ClassLabel.A;
    const radius = label === ClassLabel.A ? Math.sqrt(next()) * 0.6 : 0.8 + next() * 0.45;
    return {
      x: Math.cos(angle) * radius * DATASET_SCALE,
      y: Math.sin(angle) * radius * DATASET_SCALE,
      label,
    };
  });
}

function exclusiveOr(): Dataset {
  const next = random(2);
  return Array.from({ length: 240 }, () => {
    const x = (next() < 0.5 ? -1 : 1) * (0.075 + next() * 0.82) * DATASET_SCALE;
    const y = (next() < 0.5 ? -1 : 1) * (0.075 + next() * 0.82) * DATASET_SCALE;
    return {
      x,
      y,
      label: x * y >= 0 ? ClassLabel.B : ClassLabel.A,
    };
  });
}

function gaussian(): Dataset {
  const next = random(3);
  return Array.from({ length: 320 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    return {
      x: ((label ? 0.5 : -0.4) + normal(next) * 0.2) * DATASET_SCALE,
      y: ((label ? 0.5 : -0.4) + normal(next) * 0.2) * DATASET_SCALE,
      label,
    };
  });
}

function twoMoons(): Dataset {
  const next = random(4);
  return Array.from({ length: 240 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const angle = next() * Math.PI;
    const noise = normal(next) * 0.06;
    return label === ClassLabel.A
      ? {
          x: (Math.cos(angle) - 0.5 + noise) * 3.5,
          y: (Math.sin(angle) - 0.25 + noise) * 3.5,
          label,
        }
      : {
          x: (0.5 - Math.cos(angle) + noise) * 3.5,
          y: (0.25 - Math.sin(angle) + noise) * 3.5,
          label,
        };
  });
}

function spiral(): Dataset {
  const next = random(5);
  const pointsPerClass = 150;

  return Array.from({ length: pointsPerClass * 2 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const progress = Math.floor(index / 2) / (pointsPerClass - 1);
    const radius = 0.08 + progress * 1.2;
    const angle = 0.9 + (1 - progress) * Math.PI * 3 + label * Math.PI;
    return {
      x: (radius * Math.cos(angle) + normal(next) * 0.018) * 4.5,
      y: (radius * Math.sin(angle) + normal(next) * 0.018) * 4.5,
      label,
    };
  });
}

export const datasets = (noise: number) => ({
  circle: addNoise(circle(), noise),
  exclusiveOr: addNoise(exclusiveOr(), noise),
  gaussian: addNoise(gaussian(), noise),
  twoMoons: addNoise(twoMoons(), noise),
  spiral: addNoise(spiral(), noise),
});

function addNoise(dataset: Dataset, noise: number) {
  if (noise <= 0) {
    return dataset;
  }

  const amount = noise / 100;

  return dataset.map((point, pointIndex) => {
    const next = random(100 + 1000 + pointIndex);

    return {
      ...point,
      x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x + normal(next) * amount)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y + normal(next) * amount)),
    };
  });
}
