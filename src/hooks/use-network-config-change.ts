import { useEffect, useRef } from "react";

import type { NetworkConfigFormSchema } from "@/hooks/use-network-config-form";

type Props = {
  config: NetworkConfigFormSchema;
  onChange: (config: NetworkConfigFormSchema) => unknown;
};

export const useNetworkConfigChange = ({ config, onChange }: Props) => {
  const trainingConfigurationKey = `${config.dataset}:${config.activation}:${config.noise}:${config.hiddenLayers.map(({ neurons }) => neurons).join(",")}`;

  const previousTrainingConfigurationKey = useRef(trainingConfigurationKey);

  useEffect(() => {
    if (previousTrainingConfigurationKey.current === trainingConfigurationKey) {
      return;
    }

    previousTrainingConfigurationKey.current = trainingConfigurationKey;
    onChange(config);
  }, [trainingConfigurationKey, onChange, config]);
};
