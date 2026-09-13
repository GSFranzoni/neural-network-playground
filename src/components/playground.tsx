import { useSelector } from "@tanstack/react-form";
import {
  BrainCircuitIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useDeferredValue } from "react";

import { ClassificationPlot } from "@/components/classification-plot";
import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import {
  NetworkGraph,
  NetworkGraphConnection,
  NetworkGraphLayer,
  NetworkGraphLayerSlot,
  NetworkGraphNeuron,
} from "@/components/network-graph";
import { TrainingLossChart } from "@/components/training-loss-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useNetworkConfigForm } from "@/hooks/use-network-config-form";
import { useNetworkVisualization } from "@/hooks/use-network-visualization";
import { useTraining } from "@/hooks/use-training";
import type { Bounds } from "@/types/app";

const bounds: Bounds = {
  minX: -6,
  maxX: 6,
  minY: -6,
  maxY: 6,
};

const datasets = [
  { label: "Circle", value: "circle" },
  { label: "XOR", value: "exclusiveOr" },
  { label: "Gaussian", value: "gaussian" },
  { label: "Two moons", value: "twoMoons" },
  { label: "Spiral", value: "spiral" },
];

const activations = [
  { label: "ReLU", value: "relu" },
  { label: "Tanh", value: "tanh" },
  { label: "Sigmoid", value: "sigmoid" },
  { label: "Linear", value: "linear" },
];

function neuronId(layer: number, neuron: number): string {
  return `layer-${layer}-neuron-${neuron}`;
}

export const Playground = () => {
  const { form } = useNetworkConfigForm();

  const { values } = useSelector(form.store, (state) => state);

  const config = useDeferredValue(values);

  const {
    classification,
    activations: fields,
    dataset,
    hiddenLayers,
    inputLayer,
    outputLayer,
    network,
  } = useNetworkVisualization({ bounds, config });

  const hiddenLayerCount = config.hiddenLayers.length;

  const training = useTraining({
    config,
    network,
  });

  const addHiddenLayer = () => {
    form.setFieldValue("hiddenLayers", (layers) => [
      ...layers,
      { neurons: layers.at(-1)?.neurons ?? 8 },
    ]);
  };

  const removeHiddenLayer = () => {
    form.setFieldValue("hiddenLayers", (layers) => layers.slice(0, -1));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl">
            <BrainCircuitIcon />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm font-medium">Neural network sandbox</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Classification lab
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm">
              Explore how layer width and activation functions shape a decision surface.
            </p>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span className="bg-network-positive size-2 rounded-full" />
          Live visualization
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="pt-0">
          <NetworkGraph iteration={training.data.epoch}>
            <NetworkGraphLayer>
              {Array.from({ length: inputLayer.size }, (_, neuronIndex) => (
                <NetworkGraphNeuron
                  key={neuronIndex}
                  id={neuronId(0, neuronIndex)}
                  field={fields[0][neuronIndex]}
                />
              ))}
            </NetworkGraphLayer>
            {hiddenLayers.map((layer, layerIndex) => (
              <NetworkGraphLayer key={layerIndex}>
                <NetworkGraphLayerSlot height={48}>
                  <div className="text-muted-foreground flex h-full items-end justify-center gap-2 text-xs">
                    <form.AppField name={`hiddenLayers[${layerIndex}].neurons`}>
                      {(field) => <field.FormStepper min={1} max={8} size="icon-xs" />}
                    </form.AppField>
                  </div>
                </NetworkGraphLayerSlot>
                {Array.from({ length: layer.outputSize }, (_, neuronIndex) => (
                  <NetworkGraphNeuron
                    key={neuronIndex}
                    id={neuronId(layerIndex + 1, neuronIndex)}
                    field={fields[layerIndex + 1][neuronIndex]}
                  />
                ))}
              </NetworkGraphLayer>
            ))}
            <NetworkGraphLayer>
              <NetworkGraphNeuron id="output" size={{ width: 300, height: 300 }}>
                <ClassificationPlot
                  bounds={bounds}
                  compact
                  dataset={dataset}
                  field={classification}
                  className="rounded-3xl"
                />
              </NetworkGraphNeuron>
            </NetworkGraphLayer>
            {[...hiddenLayers, outputLayer].flatMap((layer, layerIndex) =>
              layer.weights.flatMap((row, destinationIndex) =>
                row.map((weight, sourceIndex) => {
                  const from = neuronId(layerIndex, sourceIndex);
                  const to =
                    layerIndex === hiddenLayers.length
                      ? "output"
                      : neuronId(layerIndex + 1, destinationIndex);
                  const id = `connection-${from}-${to}`;

                  return (
                    <NetworkGraphConnection key={id} id={id} from={from} to={to} weight={weight} />
                  );
                }),
              ),
            )}
          </NetworkGraph>
          <CardFooter className="text-muted-foreground gap-4 border-t text-xs">
            <span className="flex items-center gap-1.5">
              <span className="bg-network-negative size-2 rounded-full" />
              Negative weight
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-network-positive size-2 rounded-full" />
              Positive weight
            </span>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Playground settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => event.preventDefault()}>
              <FieldGroup className="gap-5">
                <form.AppField name="dataset">
                  {() => (
                    <Field>
                      <FieldLabel>Dataset</FieldLabel>
                      <FormSelect items={datasets}>
                        <FormSelect.Trigger className="w-full">
                          <FormSelect.Value placeholder="Select dataset" />
                        </FormSelect.Trigger>
                        <FormSelect.Content>
                          <FormSelect.Group>
                            {datasets.map((dataset) => (
                              <FormSelect.Item key={dataset.value} value={dataset.value}>
                                {dataset.label}
                              </FormSelect.Item>
                            ))}
                          </FormSelect.Group>
                        </FormSelect.Content>
                      </FormSelect>
                    </Field>
                  )}
                </form.AppField>
                <Field>
                  <FieldLabel>Layers</FieldLabel>
                  <div className="flex items-center gap-0">
                    <Button
                      aria-label="Remove hidden layer"
                      disabled={hiddenLayerCount <= 1}
                      onClick={removeHiddenLayer}
                      size="icon-xs"
                      type="button"
                      variant="outline"
                    >
                      <MinusIcon />
                    </Button>
                    <span className="text-muted-foreground min-w-6 text-center text-xs tabular-nums">
                      {hiddenLayerCount}
                    </span>
                    <Button
                      aria-label="Add hidden layer"
                      disabled={hiddenLayerCount >= 6}
                      onClick={addHiddenLayer}
                      size="icon-xs"
                      type="button"
                      variant="outline"
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </Field>
                <form.AppField name="activation">
                  {() => (
                    <Field>
                      <FieldLabel>Hidden activation</FieldLabel>
                      <FormSelect items={activations}>
                        <FormSelect.Trigger className="w-full">
                          <FormSelect.Value placeholder="Select activation" />
                        </FormSelect.Trigger>
                        <FormSelect.Content>
                          <FormSelect.Group>
                            {activations.map((activation) => (
                              <FormSelect.Item key={activation.value} value={activation.value}>
                                {activation.label}
                              </FormSelect.Item>
                            ))}
                          </FormSelect.Group>
                        </FormSelect.Content>
                      </FormSelect>
                    </Field>
                  )}
                </form.AppField>
                <form.AppField name="learningRate">
                  {() => (
                    <Field>
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel>Learning rate</FieldLabel>
                        <output className="text-muted-foreground text-xs tabular-nums">
                          {values.learningRate.toFixed(3)}
                        </output>
                      </div>
                      <FormSlider aria-label="Learning rate" max={0.1} min={0.001} step={0.001} />
                    </Field>
                  )}
                </form.AppField>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                aria-label={training.running ? "Pause training" : "Start training"}
                onClick={training.running ? training.stop : training.start}
                size="icon-sm"
                type="button"
                variant={training.running ? "secondary" : "default"}
              >
                {training.running ? (
                  <PauseIcon data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
              </Button>
              <Button
                aria-label="Reset training"
                disabled={training.data.epoch === 0}
                onClick={training.reset}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <RotateCcwIcon />
              </Button>
            </div>
            <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs tabular-nums">
              <span>
                <strong>Epoch</strong> {training.data.epoch}
              </span>
              {training.data.metrics && (
                <>
                  <span>·</span>
                  <span>
                    <strong>Loss</strong> {training.data.metrics.loss.toFixed(3)}
                  </span>
                  <span>·</span>
                  <span>
                    <strong>Accuracy</strong> {(training.data.metrics.accuracy * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>
            {training.data.history.length > 1 && (
              <div className="w-full overflow-hidden rounded-b-2xl">
                <TrainingLossChart data={training.data.history} />
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
