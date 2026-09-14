import { useSelector } from "@tanstack/react-form";
import {
  CoffeeIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useQueryStates } from "nuqs";
import { useDeferredValue, useEffect } from "react";

import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { ClassificationPlot } from "@/components/playground/classification-plot";
import {
  NetworkGraph,
  NetworkGraphConnection,
  NetworkGraphLayer,
  NetworkGraphLayerSlot,
  NetworkGraphNeuron,
} from "@/components/playground/network-graph";
import { TrainingLossChart } from "@/components/playground/training-loss-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useNetwork } from "@/hooks/use-network";
import { useNetworkConfigForm } from "@/hooks/use-network-config-form";
import { useNetworkVisualization } from "@/hooks/use-network-visualization";
import { useTraining } from "@/hooks/use-training";
import { bounds } from "@/lib/bounds";
import { featureDefinitions, FeatureSchema, type Feature } from "@/lib/features";
import { networkConfigSearchParams } from "@/lib/search-params";

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

function featureNeuronId(feature: Feature): string {
  return `feature-${feature}`;
}

export const Playground = () => {
  const [searchParams, setSearchParams] = useQueryStates(networkConfigSearchParams, {
    history: "replace",
  });

  const { form, addHiddenLayer, removeHiddenLayer, toggleFeature } = useNetworkConfigForm({
    defaultValues: {
      activation: searchParams.activation,
      dataset: searchParams.dataset,
      features: new Set(searchParams.features) as Set<Feature>,
      hiddenLayers: searchParams.hiddenLayers.map((neurons) => ({ neurons })),
      learningRate: searchParams.learningRate,
      noise: searchParams.noise,
    },
  });

  const { values } = useSelector(form.store, (state) => state);

  const config = useDeferredValue(values);

  const {
    dataset,
    hiddenLayers,
    network,
    neuronCount,
    outputLayer,
    recreateNetwork,
    regenerateDataset,
  } = useNetwork({ config });

  const hiddenLayerCount = config.hiddenLayers.length;

  const selectedFeatures = Array.from(config.features);

  const training = useTraining({
    config,
    dataset,
    network,
  });

  const { activations: fields, inputActivations } = useNetworkVisualization({
    features: config.features,
    network,
    neuronCount,
  });

  useEffect(() => {
    setSearchParams({
      activation: config.activation,
      dataset: config.dataset,
      features: Array.from(config.features),
      hiddenLayers: config.hiddenLayers.map(({ neurons }) => neurons),
      learningRate: config.learningRate,
      noise: config.noise,
    });
  }, [config, setSearchParams]);

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="shadow-primary/20 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] shadow-lg">
              <img
                alt=""
                aria-hidden="true"
                className="size-full"
                src={`${import.meta.env.BASE_URL}logos/neural-network.svg`}
              />
            </div>
            <div className="flex max-w-2xl flex-col gap-1.5">
              <p className="text-muted-foreground text-sm font-medium">
                Interactive classification sandbox
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Neural Network Playground
              </h1>
              <p className="text-muted-foreground max-w-xl text-[0.95rem] leading-6">
                Explore how layer width and activation functions shape a decision surface.
              </p>
            </div>
          </div>
          <a
            className={buttonVariants({
              className: "mt-1",
              size: "sm",
              variant: "secondary",
            })}
            href="https://buymeacoffee.com/gsfranzoni"
            rel="noreferrer"
            target="_blank"
          >
            <CoffeeIcon data-icon="inline-start" />
            Buy me a coffee
          </a>
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-8">
        <Card className="xl:sticky xl:top-6" size="sm">
          <CardContent>
            <form onSubmit={(event) => event.preventDefault()}>
              <FieldGroup className="gap-5">
                <form.AppField name="dataset">
                  {() => (
                    <Field>
                      <div className="flex items-center gap-1">
                        <FieldLabel>Dataset</FieldLabel>
                        <Button
                          aria-label="Regenerate dataset"
                          onClick={() => {
                            regenerateDataset();
                            training.reset();
                          }}
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          <RefreshCwIcon />
                        </Button>
                      </div>
                      <FormSelect items={datasets}>
                        <FormSelect.Trigger className="w-full">
                          <FormSelect.Value placeholder="Select dataset" />
                        </FormSelect.Trigger>
                        <FormSelect.Content>
                          <FormSelect.Group>
                            {datasets.map((dataset) => (
                              <FormSelect.Item key={dataset.value} value={dataset.value}>
                                <div className="flex items-center gap-2">
                                  <img
                                    alt=""
                                    aria-hidden="true"
                                    className="size-6 rounded-md"
                                    src={`${import.meta.env.BASE_URL}icons/${dataset.value}.png`}
                                  />
                                  {dataset.label}
                                </div>
                              </FormSelect.Item>
                            ))}
                          </FormSelect.Group>
                        </FormSelect.Content>
                      </FormSelect>
                    </Field>
                  )}
                </form.AppField>
                <form.AppField name="noise">
                  {() => (
                    <Field>
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel>Noise</FieldLabel>
                        <output className="text-muted-foreground text-xs tabular-nums">
                          {values.noise}%
                        </output>
                      </div>
                      <FormSlider aria-label="Noise" max={100} min={0} step={1} />
                    </Field>
                  )}
                </form.AppField>
                <Field>
                  <FieldLabel>Hidden Layers</FieldLabel>
                  <div className="flex items-center gap-0">
                    <Button
                      aria-label="Remove hidden layer"
                      disabled={hiddenLayerCount <= 0}
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
                          {values.learningRate.toFixed(4)}
                        </output>
                      </div>
                      <FormSlider aria-label="Learning rate" max={0.1} min={0.0001} step={0.0001} />
                    </Field>
                  )}
                </form.AppField>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 border-t">
            <div className="flex items-center justify-between gap-3">
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
                  onClick={() => {
                    recreateNetwork();
                    training.reset();
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcwIcon />
                </Button>
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                {training.running ? "Training" : "Paused"}
              </span>
            </div>
            {training.data.metrics && (
              <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                <span>
                  <strong className="text-muted-foreground font-medium">Epoch</strong>
                  <p className="text-foreground mt-1 text-sm font-semibold">
                    {training.data.epoch}
                  </p>
                </span>
                <span>
                  <strong className="text-muted-foreground font-medium">Loss</strong>
                  <p className="text-foreground mt-1 text-sm font-semibold">
                    {training.data.metrics.loss.toFixed(3)}
                  </p>
                </span>
                <span>
                  <strong className="text-muted-foreground font-medium">Accuracy</strong>
                  <p className="text-foreground mt-1 text-sm font-semibold">
                    {(training.data.metrics.accuracy * 100).toFixed(0)}%
                  </p>
                </span>
              </div>
            )}
          </CardFooter>
          {training.data.history.length > 1 && (
            <div className="bg-muted/50 -mx-4 -mb-4 overflow-hidden border-t pt-2">
              <TrainingLossChart data={training.data.history} />
            </div>
          )}
        </Card>
        <section className="min-w-0">
          <NetworkGraph
            iteration={training.data.epoch}
            isRunning={training.running}
            memoKey={network}
          >
            <NetworkGraphLayer>
              <NetworkGraphLayerSlot height={24}>
                <div className="text-muted-foreground flex h-full justify-center gap-2 text-xs">
                  <h3 className="ml-8">Features</h3>
                </div>
              </NetworkGraphLayerSlot>
              {FeatureSchema.options.map((feature, featureIndex) => (
                <NetworkGraphNeuron
                  key={feature}
                  id={featureNeuronId(feature)}
                  field={inputActivations[featureIndex]}
                  isSelectable
                  isSelected={config.features.has(feature)}
                  leftSlot={
                    <span className="line-clamp-1 text-[10px]">
                      {featureDefinitions[feature].label}
                    </span>
                  }
                  leftSlotWidth={38}
                  onSelect={() => toggleFeature(feature)}
                />
              ))}
            </NetworkGraphLayer>
            {hiddenLayers.map((layer, layerIndex) => (
              <NetworkGraphLayer key={layerIndex}>
                <NetworkGraphLayerSlot height={40}>
                  <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-xs">
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
              <NetworkGraphLayerSlot height={24}>
                <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-xs">
                  <h3>Output</h3>
                </div>
              </NetworkGraphLayerSlot>
              <NetworkGraphNeuron id="output" size={{ width: 280, height: 280 }}>
                <ClassificationPlot
                  bounds={bounds}
                  compact
                  dataset={dataset}
                  features={config.features}
                  network={network}
                  revision={training.data.epoch}
                  className="rounded-3xl"
                />
              </NetworkGraphNeuron>
            </NetworkGraphLayer>
            {[...hiddenLayers, outputLayer].flatMap((layer, layerIndex) =>
              layer.weights.flatMap((row, destinationIndex) =>
                row.map((weight, sourceIndex) => {
                  const from =
                    layerIndex === 0
                      ? featureNeuronId(selectedFeatures[sourceIndex]!)
                      : neuronId(layerIndex, sourceIndex);

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
        </section>
      </div>
    </div>
  );
};
