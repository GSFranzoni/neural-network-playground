import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsStringEnum } from "nuqs";

import {
  ActivationSchema,
  DatasetSchema,
  NetworkConfigDefaultValues,
} from "@/hooks/use-network-config-form";
import { FeatureSchema } from "@/lib/features";

export const networkConfigSearchParams = {
  activation: parseAsStringEnum(ActivationSchema.options).withDefault(
    NetworkConfigDefaultValues.activation,
  ),
  dataset: parseAsStringEnum(DatasetSchema.options).withDefault(NetworkConfigDefaultValues.dataset),
  features: parseAsArrayOf(parseAsStringEnum(FeatureSchema.options)).withDefault(
    Array.from(NetworkConfigDefaultValues.features),
  ),
  hiddenLayers: parseAsArrayOf(parseAsInteger).withDefault(
    NetworkConfigDefaultValues.hiddenLayers.map(({ neurons }) => neurons),
  ),
  learningRate: parseAsFloat.withDefault(NetworkConfigDefaultValues.learningRate),
  noise: parseAsInteger.withDefault(NetworkConfigDefaultValues.noise),
};
