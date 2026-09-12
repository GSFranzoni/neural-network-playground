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
  return Array.from({ length: 240 }, () => {
    const angle = next() * Math.PI * 2;
    const label = next() > 0.5 ? ClassLabel.B : ClassLabel.A;
    const radius = label === ClassLabel.A ? Math.sqrt(next()) * 0.55 : 0.8 + next() * 0.45;
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
    const x = (next() * 2 - 1) * DATASET_SCALE;
    const y = (next() * 2 - 1) * DATASET_SCALE;
    return {
      x,
      y,
      label: x * y >= 0 ? ClassLabel.B : ClassLabel.A,
    };
  });
}

function gaussian(): Dataset {
  const next = random(3);
  return Array.from({ length: 240 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    return {
      x: ((label ? 0.65 : -0.65) + normal(next) * 0.27) * DATASET_SCALE,
      y: ((label ? 0.55 : -0.55) + normal(next) * 0.27) * DATASET_SCALE,
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
  return Array.from({ length: 300 }, (_, index) => {
    const label = index % 2 === 0 ? ClassLabel.A : ClassLabel.B;
    const radius = 0.1 + next() * 1.1;
    const angle = radius * 4.5 + label * Math.PI + normal(next) * 0.12;
    return {
      x: (radius * Math.cos(angle) + normal(next) * 0.025) * 4.5,
      y: (radius * Math.sin(angle) + normal(next) * 0.025) * 4.5,
      label,
    };
  });
}

export const datasets: Record<string, Dataset> = {
  circle: circle(),
  exclusiveOr: exclusiveOr(),
  gaussian: gaussian(),
  twoMoons: twoMoons(),
  spiral: spiral(),
};
