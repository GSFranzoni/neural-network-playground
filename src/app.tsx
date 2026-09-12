import { ClassificationPlot } from "@/components/classification-plot";
import {
  NetworkGraph,
  NetworkGraphConnection,
  NetworkGraphLayer,
  NetworkGraphNeuron,
} from "@/components/network-graph";
import { DenseLayer, NeuralNetwork, ReLULayer } from "@/lib/neural-network";
import { datasets } from "@/mocks/dataset";
import type { Bounds } from "@/types/app";

const bounds: Bounds = {
  minX: -6,
  maxX: 6,
  minY: -6,
  maxY: 6,
};

const network = new NeuralNetwork([new DenseLayer(2, 8), new ReLULayer(), new DenseLayer(8, 2)]);

function neuronId(layer: number, neuron: number): string {
  return `layer-${layer}-neuron-${neuron}`;
}

export function App() {
  const denseLayers = network.layers.filter(
    (layer): layer is DenseLayer => layer instanceof DenseLayer,
  );

  const neuronCounts =
    denseLayers.length === 0
      ? []
      : [denseLayers[0].inputSize, ...denseLayers.map((layer) => layer.outputSize)];

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Classification playground</h1>
      <div className="space-y-8">
        <ClassificationPlot network={network} bounds={bounds} dataset={datasets.circle} />
        <NetworkGraph>
          {neuronCounts.map((count, layerIndex) => (
            <NetworkGraphLayer key={layerIndex}>
              {Array.from({ length: count }, (_, neuronIndex) => (
                <NetworkGraphNeuron key={neuronIndex} id={neuronId(layerIndex, neuronIndex)} />
              ))}
            </NetworkGraphLayer>
          ))}
          {denseLayers.flatMap((layer, layerIndex) =>
            layer.weights.flatMap((row, destinationIndex) =>
              row.map((weight, sourceIndex) => (
                <NetworkGraphConnection
                  key={`${layerIndex}-${destinationIndex}-${sourceIndex}`}
                  from={neuronId(layerIndex, sourceIndex)}
                  to={neuronId(layerIndex + 1, destinationIndex)}
                  weight={weight}
                />
              )),
            ),
          )}
        </NetworkGraph>
      </div>
    </main>
  );
}
