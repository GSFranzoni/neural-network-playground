import { useMemo } from "react";

import { type NetworkConfigFormSchema } from "@/hooks/use-network-config-form";
import { sampleField } from "@/lib/field";
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

type Props = {
  bounds: Bounds;
  formValues: NetworkConfigFormSchema;
};

export function useNetworkVisualization({ bounds, formValues }: Props) {
  const { network, inputLayer, hiddenLayers, outputLayer, neuronCount } = useMemo(() => {
    const inputLayer = new InputLayer(2);

    const outputLayer = new OutputLayer(
      inputLayer.size,
      formValues.hiddenLayers.at(-1)?.neurons ?? 1,
    );

    const hiddenLayers = formValues.hiddenLayers.map(
      ({ neurons }, index) =>
        new DenseLayer(
          index === 0 ? inputLayer.size : Number(formValues.hiddenLayers[index - 1].neurons),
          neurons,
        ),
    );

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
  }, [formValues]);

  const { classification, activations } = useMemo(
    () => ({
      classification: sampleField(bounds, 160, (x, y) => classConfidence(network.forward([x, y]))),
      activations: neuronCount.map((count, layerIndex) =>
        Array.from({ length: count }, (_, neuronIndex) =>
          sampleField(
            bounds,
            32,
            (x, y) => activationsFor(network, [x, y])[layerIndex][neuronIndex],
          ),
        ),
      ),
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
