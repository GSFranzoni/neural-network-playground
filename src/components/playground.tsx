import { useState } from "react";

import { ClassificationPlot } from "@/components/classification-plot";
import {
  NetworkGraph,
  NetworkGraphConnection,
  NetworkGraphLayer,
  NetworkGraphLayerSlot,
  NetworkGraphNeuron,
} from "@/components/network-graph";
import {
  NetworkConfigFormSchema,
  NetworkConfigFormValues,
  useNetworkConfigForm,
} from "@/hooks/use-network-config-form";
import { useNetworkVisualization } from "@/hooks/use-network-visualization";
import type { Bounds } from "@/types/app";

const bounds: Bounds = {
  minX: -6,
  maxX: 6,
  minY: -6,
  maxY: 6,
};

function neuronId(layer: number, neuron: number): string {
  return `layer-${layer}-neuron-${neuron}`;
}

export const Playground = () => {
  const [formValues, setFormValues] = useState<NetworkConfigFormSchema>(NetworkConfigFormValues);

  const { form } = useNetworkConfigForm({
    onChange: setFormValues,
  });

  const { classification, activations, dataset, hiddenLayers, inputLayer, outputLayer } =
    useNetworkVisualization({ bounds, formValues });

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Classification playground</h1>
      <div className="space-y-8">
        <NetworkGraph>
          <NetworkGraphLayer>
            {Array.from({ length: inputLayer.size }, (_, neuronIndex) => (
              <NetworkGraphNeuron
                key={neuronIndex}
                id={neuronId(0, neuronIndex)}
                field={activations[0][neuronIndex]}
              />
            ))}
          </NetworkGraphLayer>
          {hiddenLayers.map((layer, layerIndex) => (
            <NetworkGraphLayer key={layerIndex}>
              <NetworkGraphLayerSlot height={48}>
                <div className="flex h-12 items-end justify-center">
                  <form.AppField name={`hiddenLayers[${layerIndex}].neurons`}>
                    {(field) => <field.FormStepper min={1} max={8} />}
                  </form.AppField>
                </div>
              </NetworkGraphLayerSlot>
              {Array.from({ length: layer.outputSize }, (_, neuronIndex) => (
                <NetworkGraphNeuron
                  key={neuronIndex}
                  id={neuronId(layerIndex + 1, neuronIndex)}
                  field={activations[layerIndex + 1][neuronIndex]}
                />
              ))}
            </NetworkGraphLayer>
          ))}
          <NetworkGraphLayer>
            <NetworkGraphNeuron id="output" size={{ width: 350, height: 350 }}>
              <ClassificationPlot
                bounds={bounds}
                compact
                dataset={dataset}
                field={classification}
              />
            </NetworkGraphNeuron>
          </NetworkGraphLayer>
          {[...hiddenLayers, outputLayer].flatMap((layer, layerIndex) =>
            layer.weights.flatMap((row, destinationIndex) =>
              row.map((weight, sourceIndex) => (
                <NetworkGraphConnection
                  key={`${layerIndex}-${destinationIndex}-${sourceIndex}`}
                  from={neuronId(layerIndex, sourceIndex)}
                  to={
                    layerIndex === hiddenLayers.length
                      ? "output"
                      : neuronId(layerIndex + 1, destinationIndex)
                  }
                  weight={weight}
                />
              )),
            ),
          )}
        </NetworkGraph>
      </div>
    </>
  );
};
