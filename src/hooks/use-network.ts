import { useRef, useState } from "react";

import { useNetworkConfigChange } from "@/hooks/use-network-config-change";
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
import { datasets } from "@/mocks/datasets";

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

const createNetwork = (config: NetworkConfigFormSchema, datasetSeed: number) => {
  const inputLayer = new InputLayer(config.features.size);

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

  const dataset = datasets(config.noise, datasetSeed)[config.dataset];

  return { network, inputLayer, hiddenLayers, outputLayer, neuronCount, dataset };
};

type Props = {
  config: NetworkConfigFormSchema;
};

export function useNetwork({ config }: Props) {
  const datasetSeed = useRef(0);

  const [networkState, setNetworkState] = useState(() => createNetwork(config, 0));

  const recreateNetwork = () => {
    setNetworkState(createNetwork(config, datasetSeed.current));
  };

  const regenerateDataset = () => {
    datasetSeed.current += 1;
    setNetworkState(createNetwork(config, datasetSeed.current));
  };

  useNetworkConfigChange({
    config,
    onChange: recreateNetwork,
  });

  return {
    ...networkState,
    regenerateDataset,
    recreateNetwork,
  };
}
