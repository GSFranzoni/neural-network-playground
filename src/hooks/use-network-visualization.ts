import { sampleField } from "@/lib/field";
import { DenseLayer, type NeuralNetwork } from "@/lib/neural-network";
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

function classConfidence(output: number[]): number {
  if (output.length === 1) {
    return 1 / (1 + Math.exp(-output[0]));
  }

  const largest = Math.max(...output);
  const probabilities = output.map((value) => Math.exp(value - largest));
  return probabilities[1] / probabilities.reduce((sum, value) => sum + value, 0);
}

type Props = {
  network: NeuralNetwork;
  bounds: Bounds;
};

export function useNetworkVisualization({ network, bounds }: Props) {
  const networkVersion = network
    .export()
    .map((parameter) => parameter.join(","))
    .join("|");

  const classification = sampleField(bounds, 160, (x, y) =>
    classConfidence(network.forward([x, y])),
  );

  const denseLayers = network.layers.filter(
    (layer): layer is DenseLayer => layer instanceof DenseLayer,
  );

  const neuronCount =
    denseLayers.length === 0
      ? []
      : [denseLayers[0].inputSize, ...denseLayers.map((layer) => layer.outputSize)];

  const activations = neuronCount.map((count, layerIndex) =>
    Array.from({ length: count }, (_, neuronIndex) =>
      sampleField(bounds, 32, (x, y) => activationsFor(network, [x, y])[layerIndex][neuronIndex]),
    ),
  );

  return {
    networkVersion,
    classification,
    activations,
    neuronCount,
    denseLayers,
  };
}
