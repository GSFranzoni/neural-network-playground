import { useMemo } from "react";

import type { ScalarField } from "@/lib/field";
import { DenseLayer, NeuralNetwork } from "@/lib/neural-network";
import type { Bounds } from "@/types/app";

function activationsFor(network: NeuralNetwork, input: [number, number]): number[][] {
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
  bounds: Bounds,
  network: NeuralNetwork,
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
      const activations = activationsFor(network, [x, y]);

      for (let layerIndex = 0; layerIndex < activations.length; layerIndex++) {
        for (let neuronIndex = 0; neuronIndex < activations[layerIndex].length; neuronIndex++) {
          values[layerIndex][neuronIndex][row][column] = activations[layerIndex][neuronIndex];
        }
      }
    }
  }

  return values.map((layer) => layer.map((values) => ({ values })));
}

type VisualizationProps = {
  bounds: Bounds;
  network: NeuralNetwork;
  neuronCount: number[];
};

export function useNetworkVisualization({ bounds, network, neuronCount }: VisualizationProps) {
  const activations = useMemo(
    () => sampleActivationFields(bounds, network, neuronCount, 32),
    [bounds, network, neuronCount],
  );

  return {
    activations,
  };
}
