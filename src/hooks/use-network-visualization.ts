import { useMemo } from "react";

import { type NetworkConfigFormSchema } from "@/hooks/use-network-config-form";
import { sampleField, type ScalarField } from "@/lib/field";
import {
  DenseLayer,
  InputLayer,
  LinearLayer,
  NeuralNetwork,
  OutputLayer,
  ReLULayer,
  SigmoidLayer,
  TanhLayer,
  type Layer,
} from "@/lib/neural-network";
import { datasets } from "@/mocks/dataset";
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

function activationLayer(activation: NetworkConfigFormSchema["activation"]): Layer {
  switch (activation) {
    case "relu":
      return new ReLULayer();
    case "sigmoid":
      return new SigmoidLayer();
    case "tanh":
      return new TanhLayer();
    case "linear":
      return new LinearLayer();
  }
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

type Props = {
  bounds: Bounds;
  formValues: NetworkConfigFormSchema;
};

export function useNetworkVisualization({ bounds, formValues }: Props) {
  const hiddenLayerSignature = formValues.hiddenLayers.map((layer) => layer.neurons).join(",");

  const { network, inputLayer, hiddenLayers, outputLayer, neuronCount } = useMemo(() => {
    const inputLayer = new InputLayer(2);
    const hiddenLayerSizes = hiddenLayerSignature.split(",").map(Number);
    const hiddenLayers = hiddenLayerSizes.map(
      (neurons, index) =>
        new DenseLayer(index === 0 ? inputLayer.size : hiddenLayerSizes[index - 1], neurons),
    );
    const outputLayer = new OutputLayer(hiddenLayers.at(-1)?.outputSize ?? inputLayer.size, 1);

    const neuronCount = [
      inputLayer.size,
      ...hiddenLayers.map((layer) => layer.outputSize),
      outputLayer.outputSize,
    ];

    const network = new NeuralNetwork([
      inputLayer,
      ...hiddenLayers.flatMap((layer) => [layer, activationLayer(formValues.activation)]),
      outputLayer,
    ]);

    return {
      network,
      inputLayer,
      hiddenLayers,
      outputLayer,
      neuronCount,
    };
  }, [formValues.activation, hiddenLayerSignature]);

  const { classification, activations } = useMemo(
    () => ({
      classification: sampleField(bounds, 160, (x, y) => classConfidence(network.forward([x, y]))),
      activations: sampleActivationFields(bounds, network, neuronCount, 32),
    }),
    [bounds, network, neuronCount],
  );

  return {
    network,
    classification,
    activations,
    inputLayer,
    hiddenLayers,
    outputLayer,
    dataset: datasets[formValues.dataset],
  };
}
