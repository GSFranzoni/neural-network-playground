import z from "zod";

import { coordinateScale } from "@/lib/bounds";

type Coordinates = { x: number; y: number };

export const featureDefinitions = {
  x1: { label: "X₁", transform: ({ x }: Coordinates) => x / coordinateScale },
  x2: { label: "X₂", transform: ({ y }: Coordinates) => y / coordinateScale },
  x1Squared: { label: "X₁²", transform: ({ x }: Coordinates) => (x / coordinateScale) ** 2 },
  x2Squared: { label: "X₂²", transform: ({ y }: Coordinates) => (y / coordinateScale) ** 2 },
  x1x2: {
    label: "X₁ × X₂",
    transform: ({ x, y }: Coordinates) => (x / coordinateScale) * (y / coordinateScale),
  },
  sinX1: { label: "sin(X₁)", transform: ({ x }: Coordinates) => Math.sin(x / coordinateScale) },
  sinX2: { label: "sin(X₂)", transform: ({ y }: Coordinates) => Math.sin(y / coordinateScale) },
} as const;

export type Feature = keyof typeof featureDefinitions;

export const FeatureSchema = z.enum(Object.keys(featureDefinitions) as [Feature, ...Feature[]]);

export function encodeCoordinates(x: number, y: number, features: ReadonlySet<Feature>) {
  const coordinates = { x, y };

  return Array.from(features, (feature) => featureDefinitions[feature].transform(coordinates));
}
