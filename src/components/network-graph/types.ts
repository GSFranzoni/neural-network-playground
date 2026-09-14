import type { PointerEvent, ReactElement, ReactNode, RefObject } from "react";

import type { ScalarField } from "@/lib/field";

export type NodeSize = { width: number; height: number };

export type Position = NodeSize & { x: number; y: number };

export type NetworkGraphNeuronProps = {
  id: string;
  children?: ReactNode;
  field?: ScalarField;
  isSelectable?: boolean;
  isSelected?: boolean;
  leftSlot?: ReactNode;
  leftSlotWidth?: number;
  onSelect?: () => void;
  size?: NodeSize;
  position?: Position;
};

export type NetworkGraphConnectionProps = {
  id: string;
  from: string;
  to: string;
  weight: number;
  fromPosition?: Position;
  onHover?: (id: string, event: PointerEvent<SVGPathElement>) => void;
  onLeave?: () => void;
  toPosition?: Position;
  registerPath?: (id: string, element: SVGPathElement | null) => void;
};

export type NetworkGraphLayerProps = {
  children: ReactNode;
  width?: number;
  x?: number;
  topOffset?: number;
};

export type NetworkGraphLayerSlotProps = {
  children: ReactNode;
  className?: string;
  height?: number;
  position?: { x: number; y: number };
  width?: number;
};

export type NetworkGraphProps = {
  children: ReactNode;
  isRunning: boolean;
  iteration?: number;
  memoKey: unknown;
};

export type ConnectionTooltipProps = {
  position: { x: number; y: number };
  tooltipRef: RefObject<SVGGElement | null>;
  weight: number;
};

export type NetworkGraphConnectionElement = ReactElement<NetworkGraphConnectionProps>;
