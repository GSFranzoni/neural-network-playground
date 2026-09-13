import { useMemo, useState } from "react";

import { sampleField } from "@/lib/field";
import {
  DenseLayer,
  InputLayer,
  NeuralNetwork,
  OutputLayer,
  ReLULayer,
  type Layer,
} from "@/lib/neural-network";
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
  bounds: Bounds;
};

export function useNetworkVisualization({ bounds }: Props) {
  const [inputLayer] = useState(() => new InputLayer(2));

  const [hiddenLayers, setHiddenLayers] = useState(() => [
    new DenseLayer(inputLayer.size, 8),
    new DenseLayer(8, 8),
  ]);

  const [outputLayer] = useState(() => new OutputLayer(8, 1));

  const layers = useMemo(
    () =>
      [
        inputLayer,
        ...hiddenLayers.flatMap((layer) => [layer, new ReLULayer()]),
        outputLayer,
      ] as Layer[],
    [hiddenLayers, inputLayer, outputLayer],
  );

  const network = useMemo(() => new NeuralNetwork(layers), [layers]);

  const neuronCount = [
    inputLayer.size,
    ...hiddenLayers.map((layer) => layer.outputSize),
    outputLayer.outputSize,
  ];

  const classification = sampleField(bounds, 160, (x, y) =>
    classConfidence(network.forward([x, y])),
  );

  const activations = neuronCount.map((count, layerIndex) =>
    Array.from({ length: count }, (_, neuronIndex) =>
      sampleField(bounds, 32, (x, y) => activationsFor(network, [x, y])[layerIndex][neuronIndex]),
    ),
  );

  return {
    network,
    classification,
    activations,
    neuronCount,
    inputLayer,
    hiddenLayers,
    outputLayer,
    setHiddenLayers,
  };
}
