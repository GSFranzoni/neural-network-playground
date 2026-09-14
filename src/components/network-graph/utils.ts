import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { DEFAULT_LEFT_SLOT_WIDTH, DEFAULT_NEURON_SIZE, NEURON_SPACING } from "./constants";
import { NetworkGraphLayerSlot } from "./layer-slot";
import { NetworkGraphNeuron } from "./neuron";
import type { NetworkGraphLayerSlotProps, NetworkGraphNeuronProps } from "./types";

export function neuronY(index: number, neuronHeight: number, topOffset: number): number {
  return topOffset + neuronHeight / 2 + index * NEURON_SPACING;
}

export function sizeFor(neuron: ReactElement<NetworkGraphNeuronProps>) {
  return neuron.props.size ?? DEFAULT_NEURON_SIZE;
}

export function leftSlotWidthFor(neuron: ReactElement<NetworkGraphNeuronProps>): number {
  return neuron.props.leftSlot ? (neuron.props.leftSlotWidth ?? DEFAULT_LEFT_SLOT_WIDTH) : 0;
}

export function layerNeurons(children: ReactNode): ReactElement<NetworkGraphNeuronProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphNeuronProps> =>
      isValidElement<NetworkGraphNeuronProps>(child) && child.type === NetworkGraphNeuron,
  );
}

export function layerSlots(children: ReactNode): ReactElement<NetworkGraphLayerSlotProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphLayerSlotProps> =>
      isValidElement<NetworkGraphLayerSlotProps>(child) && child.type === NetworkGraphLayerSlot,
  );
}
