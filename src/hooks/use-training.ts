import { useState } from "react";

import { useAnimationFrameInterval } from "@/hooks/use-animation-frame-interval";
import { useNetworkConfigChange } from "@/hooks/use-network-config-change";
import type { NetworkConfigFormSchema } from "@/hooks/use-network-config-form";
import { shuffled } from "@/lib/arrays";
import { encodeCoordinates } from "@/lib/features";
import { binaryCrossEntropy, NeuralNetwork, SGD } from "@/lib/neural-network";
import type { Dataset } from "@/types/app";

export type TrainingMetrics = {
  accuracy: number;
  loss: number;
};

export type TrainingPoint = TrainingMetrics & {
  epoch: number;
};

export type TrainingState = {
  epoch: number;
  history: TrainingPoint[];
  metrics: TrainingMetrics | null;
};

type Props = {
  config: NetworkConfigFormSchema;
  dataset: Dataset;
  network: NeuralNetwork;
};

const BATCH_EPOCHS = 1;

const UPDATE_INTERVAL_MS = 20;

const MAX_HISTORY_POINTS = 60;

const initialTrainingState: TrainingState = {
  epoch: 0,
  history: [],
  metrics: null,
};

function trainNetwork(
  network: NeuralNetwork,
  dataset: Dataset,
  config: NetworkConfigFormSchema,
  epochs: number,
): TrainingMetrics {
  const optimizer = new SGD(config.learningRate);
  let totalLoss = 0;
  let correct = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const sample of dataset) {
      const [logit] = network.forward(encodeCoordinates(sample.x, sample.y, config.features));
      const result = binaryCrossEntropy(logit, sample.label);
      totalLoss += result.loss;
      correct += Number((logit >= 0 ? 1 : 0) === sample.label);
      network.backward(result.gradient);
      optimizer.step(network.parameters());
    }
  }

  const samples = dataset.length * epochs;

  return { loss: totalLoss / samples, accuracy: correct / samples };
}

export function useTraining({ config, dataset, network }: Props) {
  const [running, setRunning] = useState(false);

  const [data, setData] = useState<TrainingState>(initialTrainingState);

  const trainingDataset = shuffled(dataset);

  const train = (epochs: number) => trainNetwork(network, trainingDataset, config, epochs);

  const handleBatch = (metrics: TrainingMetrics, epochs: number) => {
    setData((current) => {
      const epoch = current.epoch + epochs;

      return {
        epoch,
        history: [...current.history.slice(-(MAX_HISTORY_POINTS - 1)), { epoch, ...metrics }],
        metrics,
      };
    });
  };

  const runBatch = () => {
    handleBatch(train(BATCH_EPOCHS), BATCH_EPOCHS);
  };

  useAnimationFrameInterval({
    enabled: running,
    intervalMs: UPDATE_INTERVAL_MS,
    onTick: runBatch,
  });

  const start = () => setRunning(true);

  const stop = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setData(initialTrainingState);
  };

  useNetworkConfigChange({
    config,
    onChange: reset,
  });

  return { data, reset, running, start, stop };
}
