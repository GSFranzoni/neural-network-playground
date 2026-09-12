import { ClassificationPlot } from "@/components/classification-plot";
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

export function App() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Classification playground</h1>
      <ClassificationPlot network={network} bounds={bounds} dataset={datasets.circle} />
    </main>
  );
}
