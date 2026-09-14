import z from "zod";

type Coordinates = { x: number; y: number };

export const featureDefinitions = {
  x1: {
    label: "X₁",
    transform: ({ x }: Coordinates) => x,
  },
  x2: {
    label: "X₂",
    transform: ({ y }: Coordinates) => y,
  },
  x1Squared: {
    label: "X₁²",
    transform: ({ x }: Coordinates) => x ** 2,
  },
  x2Squared: {
    label: "X₂²",
    transform: ({ y }: Coordinates) => y ** 2,
  },
  x1x2: {
    label: "X₁ × X₂",
    transform: ({ x, y }: Coordinates) => x * y,
  },
  sinX1: {
    label: "sin(X₁)",
    transform: ({ x }: Coordinates) => Math.sin(x),
  },
  sinX2: {
    label: "sin(X₂)",
    transform: ({ y }: Coordinates) => Math.sin(y),
  },
} as const;

export type Feature = keyof typeof featureDefinitions;

export const FeatureSchema = z.enum(Object.keys(featureDefinitions) as [Feature, ...Feature[]]);

export function encodeCoordinates(x: number, y: number, features: ReadonlySet<Feature>) {
  const coordinates = { x, y };

  return Array.from(features, (feature) => {
    const definition = featureDefinitions[feature];
    return definition.transform(coordinates);
  });
}
