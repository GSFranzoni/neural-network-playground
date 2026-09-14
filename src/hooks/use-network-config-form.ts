import z from "zod";

import { FeatureSchema, type Feature } from "@/lib/features";
import { useAppForm } from "@/lib/form";

export const ActivationSchema = z.enum(["relu", "tanh", "sigmoid", "linear"]);

export const DatasetSchema = z.enum(["circle", "exclusiveOr", "gaussian", "twoMoons", "spiral"]);

export const NetworkConfigFormSchema = z.object({
  activation: ActivationSchema,
  dataset: DatasetSchema,
  learningRate: z.number().positive(),
  noise: z.number().min(0).max(100),
  hiddenLayers: z
    .array(
      z.object({
        neurons: z.number().int().min(1).max(8),
      }),
    )
    .min(1)
    .max(6),
  features: z.set(FeatureSchema),
});

export type NetworkConfigFormSchema = z.infer<typeof NetworkConfigFormSchema>;

export const NetworkConfigDefaultValues = {
  activation: "tanh",
  dataset: "circle",
  hiddenLayers: [
    {
      neurons: 4,
    },
    {
      neurons: 2,
    },
  ],
  learningRate: 0.03,
  noise: 0,
  features: new Set(["x1", "x2"]),
} as NetworkConfigFormSchema;

type Props = {
  defaultValues: Partial<NetworkConfigFormSchema>;
};

export const useNetworkConfigForm = ({ defaultValues }: Props) => {
  const form = useAppForm({
    validators: { onChange: NetworkConfigFormSchema },
    defaultValues: { ...NetworkConfigDefaultValues, ...defaultValues },
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

  const toggleFeature = (feature: Feature) => {
    form.setFieldValue("features", (features) => {
      const nextFeatures = new Set(features);

      if (nextFeatures.has(feature)) {
        nextFeatures.delete(feature);
      } else {
        nextFeatures.add(feature);
      }

      return nextFeatures;
    });
  };

  return {
    form,
    addHiddenLayer,
    removeHiddenLayer,
    toggleFeature,
  };
};
