import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs";

import {
  ActivationSchema,
  DatasetSchema,
  NetworkConfigDefaultValues,
} from "@/hooks/use-network-config-form";
import { FeatureSchema } from "@/lib/features";

export const networkConfigSearchParams = {
  activation: parseAsStringEnum(ActivationSchema.options)
    .withDefault(NetworkConfigDefaultValues.activation)
    .withOptions({ clearOnDefault: false }),
  dataset: parseAsStringEnum(DatasetSchema.options)
    .withDefault(NetworkConfigDefaultValues.dataset)
    .withOptions({ clearOnDefault: false }),
  features: parseAsArrayOf(parseAsStringEnum(FeatureSchema.options))
    .withDefault(Array.from(NetworkConfigDefaultValues.features))
    .withOptions({ clearOnDefault: false }),
  hiddenLayers: parseAsArrayOf(parseAsInteger)
    .withDefault(
      NetworkConfigDefaultValues.hiddenLayers.map(({ neurons }) => neurons),
    )
    .withOptions({ clearOnDefault: false }),
  learningRate: parseAsFloat
    .withDefault(NetworkConfigDefaultValues.learningRate)
    .withOptions({ clearOnDefault: false }),
  noise: parseAsInteger
    .withDefault(NetworkConfigDefaultValues.noise)
    .withOptions({ clearOnDefault: false }),
};
