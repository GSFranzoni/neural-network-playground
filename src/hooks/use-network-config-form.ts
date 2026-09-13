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

export const useNetworkConfigForm = () => {
  const form = useAppForm({
    validators: { onChange: NetworkConfigFormSchema },
    defaultValues: {
      activation: "linear",
      dataset: "circle",
      hiddenLayers: [
        {
          neurons: 8,
        },
        {
          neurons: 8,
        },
      ],
      learningRate: 0.01,
    } as NetworkConfigFormSchema,
  });

  return {
    form,
  };
};
