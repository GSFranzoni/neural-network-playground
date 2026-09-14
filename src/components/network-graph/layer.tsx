import { cloneElement } from "react";

import { VERTICAL_PADDING } from "./constants";
import { NetworkGraphLayerSlot } from "./layer-slot";
import type { NetworkGraphLayerProps } from "./types";
import { layerNeurons, layerSlots, leftSlotWidthFor, neuronY, sizeFor } from "./utils";

export function NetworkGraphLayer({
  children,
  width,
  x = 0,
  topOffset = VERTICAL_PADDING,
}: NetworkGraphLayerProps) {
  const neurons = layerNeurons(children);

  const slots = layerSlots(children);

  const leftSlotWidth = Math.max(...neurons.map(leftSlotWidthFor), 0);

  return (
    <g>
      {neurons.map((neuron, index) => {
        const size = sizeFor(neuron);
        return cloneElement(neuron, {
          position: {
            x: width ? x - width / 2 + leftSlotWidth + size.width / 2 : x,
            y: neuronY(index, size.height, topOffset),
            ...size,
          },
        });
      })}
      {slots.map((slot) => cloneElement(slot, { position: { x, y: VERTICAL_PADDING } }))}
    </g>
  );
}

export { NetworkGraphLayerSlot };
