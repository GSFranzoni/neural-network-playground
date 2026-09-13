import z from "zod";

import { useAppForm } from "@/lib/form";

export const ActivationSchema = z.enum(["relu", "tanh", "sigmoid", "linear"]);

export const DatasetSchema = z.enum(["circle", "exclusiveOr", "gaussian", "twoMoons", "spiral"]);

export const NetworkConfigFormSchema = z.object({
  activation: ActivationSchema,
  dataset: DatasetSchema,
  learningRate: z.number().positive(),
  hiddenLayers: z
    .array(
      z.object({
        neurons: z.number().int().min(1).max(8),
      }),
    )
    .min(1)
    .max(6),
});

export type NetworkConfigFormSchema = z.infer<typeof NetworkConfigFormSchema>;

export const NetworkConfigDefaultValues = {
  activation: "tanh",
  dataset: "circle",
  hiddenLayers: [
    {
      neurons: 8,
    },
    {
      neurons: 2,
    },
  ],
  learningRate: 0.03,
} as NetworkConfigFormSchema;

export const useNetworkConfigForm = () => {
  const form = useAppForm({
    validators: { onChange: NetworkConfigFormSchema },
    defaultValues: NetworkConfigDefaultValues,
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

  return {
    form,
    addHiddenLayer,
    removeHiddenLayer,
  };
};
