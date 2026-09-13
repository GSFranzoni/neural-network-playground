import { useMemo } from "react";

import type { NetworkConfigFormSchema } from "@/hooks/use-network-config-form";
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

type Props = {
  config: NetworkConfigFormSchema;
};

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

export function useNetwork({ config }: Props) {
  const { network, inputLayer, hiddenLayers, outputLayer, neuronCount } = useMemo(() => {
    const inputLayer = new InputLayer(2);

    const hiddenLayers = config.hiddenLayers.map(
      ({ neurons }, index) =>
        new DenseLayer(
          index === 0 ? inputLayer.size : config.hiddenLayers[index - 1].neurons,
          neurons,
        ),
    );

    const outputLayer = new OutputLayer(hiddenLayers.at(-1)?.outputSize ?? inputLayer.size, 1);

    const neuronCount = [
      inputLayer.size,
      ...hiddenLayers.map((layer) => layer.outputSize),
      outputLayer.outputSize,
    ];

    const network = new NeuralNetwork([
      inputLayer,
      ...hiddenLayers.flatMap((layer) => [layer, activationLayer(config.activation)]),
      outputLayer,
    ]);

    return {
      network,
      inputLayer,
      hiddenLayers,
      outputLayer,
      neuronCount,
    };
  }, [config.activation, config.hiddenLayers]);

  return {
    network,
    inputLayer,
    hiddenLayers,
    outputLayer,
    neuronCount,
    dataset: datasets[config.dataset],
  };
}
