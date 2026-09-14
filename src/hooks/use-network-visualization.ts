import { useMemo } from "react";

import { bounds } from "@/lib/bounds";
import { encodeCoordinates, featureDefinitions, FeatureSchema, type Feature } from "@/lib/features";
import type { ScalarField } from "@/lib/field";
import { DenseLayer, NeuralNetwork } from "@/lib/neural-network";

function activationsFor(network: NeuralNetwork, input: number[]): number[][] {
  let values: number[] = input;

  const activations = [values];

  for (const layer of network.layers) {
    values = layer.forward(values);

    if (layer instanceof DenseLayer) {
      activations.push(values);
    }
  }

  return activations;
}

function sampleActivationFields(
  network: NeuralNetwork,
  features: Set<Feature>,
  neuronCount: number[],
  resolution: number,
): ScalarField[][] {
  const values = neuronCount.map((count) =>
    Array.from({ length: count }, () =>
      Array.from({ length: resolution }, () => Array<number>(resolution)),
    ),
  );

  for (let row = 0; row < resolution; row++) {
    const y = bounds.maxY - ((row + 0.5) / resolution) * (bounds.maxY - bounds.minY);

    for (let column = 0; column < resolution; column++) {
      const x = bounds.minX + ((column + 0.5) / resolution) * (bounds.maxX - bounds.minX);
      const activations = activationsFor(network, encodeCoordinates(x, y, features));

      for (let layerIndex = 0; layerIndex < activations.length; layerIndex++) {
        const layerValues = values[layerIndex];

        if (!layerValues) {
          continue;
        }

        for (let neuronIndex = 0; neuronIndex < activations[layerIndex].length; neuronIndex++) {
          const neuronValues = layerValues[neuronIndex];

          if (neuronValues) {
            neuronValues[row][column] = activations[layerIndex][neuronIndex];
          }
        }
      }
    }
  }

  return values.map((layer) => layer.map((values) => ({ values })));
}

function sampleFeatureActivationFields(
  features: readonly Feature[],
  resolution: number,
): ScalarField[] {
  return features.map((feature) => {
    const values = Array.from({ length: resolution }, () => Array<number>(resolution));

    for (let row = 0; row < resolution; row++) {
      const y = bounds.maxY - ((row + 0.5) / resolution) * (bounds.maxY - bounds.minY);

      for (let column = 0; column < resolution; column++) {
        const x = bounds.minX + ((column + 0.5) / resolution) * (bounds.maxX - bounds.minX);
        values[row][column] = featureDefinitions[feature].transform({ x, y });
      }
    }

    return { values };
  });
}

type VisualizationProps = {
  features: Set<Feature>;
  network: NeuralNetwork;
  neuronCount: number[];
};

export function useNetworkVisualization({ features, network, neuronCount }: VisualizationProps) {
  const activations = useMemo(
    () => sampleActivationFields(network, features, neuronCount, 32),
    [features, network, neuronCount],
  );

  const inputActivations = useMemo(
    () => sampleFeatureActivationFields(FeatureSchema.options, 32),
    [],
  );

  return {
    activations,
    inputActivations,
  };
}
