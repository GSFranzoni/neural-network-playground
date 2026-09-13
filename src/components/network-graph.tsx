import type { ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement, useId } from "react";

import { useResizeObserver } from "@/hooks/use-resize-observer";
import type { ScalarField } from "@/lib/field";

type NodeSize = { width: number; height: number };
type Position = NodeSize & { x: number; y: number };

type NetworkGraphNeuronProps = {
  id: string;
  children?: ReactNode;
  field?: ScalarField;
  size?: NodeSize;
  position?: Position;
};

type NetworkGraphConnectionProps = {
  from: string;
  to: string;
  weight: number;
  maxWeight?: number;
  fromPosition?: Position;
  toPosition?: Position;
};

type NetworkGraphLayerProps = {
  children: ReactNode;
  x?: number;
  height?: number;
  topOffset?: number;
};

type NetworkGraphLayerSlotProps = {
  children: ReactNode;
  className?: string;
  height?: number;
  position?: { x: number; y: number };
  width?: number;
};

type NetworkGraphProps = { children: ReactNode };

const DEFAULT_NEURON_SIZE = { width: 32, height: 32 };
const HORIZONTAL_PADDING = 32;
const VERTICAL_PADDING = 24;
const NEURON_SPACING = 44;

function neuronY(
  index: number,
  count: number,
  height: number,
  neuronHeight: number,
  topOffset: number,
): number {
  if (count === 1) {
    return topOffset + neuronHeight / 2;
  }

  const spacing = Math.max(0, (height - topOffset - VERTICAL_PADDING - neuronHeight) / (count - 1));

  return topOffset + neuronHeight / 2 + index * spacing;
}

function sizeFor(neuron: ReactElement<NetworkGraphNeuronProps>): NodeSize {
  return neuron.props.size ?? DEFAULT_NEURON_SIZE;
}

function activationCells(field: ScalarField) {
  const cells = field.values.flatMap((row, rowIndex) =>
    row.map((value, column) => ({ row: rowIndex, column, value })),
  );
  const maxMagnitude = Math.max(1e-6, ...cells.map((cell) => Math.abs(cell.value)));
  return cells.map((cell) => ({
    ...cell,
    opacity: 0.12 + (Math.abs(cell.value) / maxMagnitude) * 0.88,
  }));
}

function layerNeurons(children: ReactNode): ReactElement<NetworkGraphNeuronProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphNeuronProps> =>
      isValidElement<NetworkGraphNeuronProps>(child) && child.type === NetworkGraphNeuron,
  );
}

function layerSlots(children: ReactNode): ReactElement<NetworkGraphLayerSlotProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphLayerSlotProps> =>
      isValidElement<NetworkGraphLayerSlotProps>(child) && child.type === NetworkGraphLayerSlot,
  );
}

export const NetworkGraphNeuron = ({ children, field, position }: NetworkGraphNeuronProps) => {
  const clipId = useId();
  if (!position) {
    return null;
  }

  const { width, height } = position;
  const left = position.x - width / 2;
  const top = position.y - height / 2;
  const cellWidth = field?.values[0]?.length ? width / field.values[0].length : 0;
  const cellHeight = field?.values.length ? height / field.values.length : 0;
  const cells = field ? activationCells(field) : [];

  if (children) {
    return (
      <foreignObject x={left} y={top} width={width} height={height}>
        <div className="h-full w-full">{children}</div>
      </foreignObject>
    );
  }

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={width} height={height} rx="5" />
        </clipPath>
      </defs>
      <rect x={left} y={top} width={width} height={height} rx="5" fill="var(--card)" />
      <g clipPath={`url(#${clipId})`}>
        {cells.map((cell) => (
          <rect
            key={`${cell.row}-${cell.column}`}
            x={left + cell.column * cellWidth}
            y={top + cell.row * cellHeight}
            width={cellWidth + 0.25}
            height={cellHeight + 0.25}
            fill={cell.value >= 0 ? "var(--network-positive)" : "var(--network-negative)"}
            fillOpacity={cell.opacity}
          />
        ))}
      </g>
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="1.5"
      />
    </g>
  );
};

export const NetworkGraphConnection = ({
  fromPosition,
  toPosition,
  weight,
  maxWeight = 1,
}: NetworkGraphConnectionProps) => {
  if (!fromPosition || !toPosition) {
    return null;
  }

  const magnitude = Math.min(Math.abs(weight) / maxWeight, 1);

  const controlX =
    (fromPosition.x + fromPosition.width / 2 + toPosition.x - toPosition.width / 2) / 2;

  const color = weight >= 0 ? "var(--network-positive)" : "var(--network-negative)";

  const path = `M ${fromPosition.x + fromPosition.width / 2} ${fromPosition.y} C ${controlX} ${fromPosition.y}, ${controlX} ${toPosition.y}, ${toPosition.x - toPosition.width / 2} ${toPosition.y}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeDasharray="3 7"
      strokeLinecap="round"
      strokeOpacity={0.4 + magnitude * 0.6}
      strokeWidth={1.25 + magnitude * 2.5}
    >
      <animate
        attributeName="stroke-dashoffset"
        dur={`${(1.8 - magnitude * 0.9).toFixed(2)}s`}
        from="0"
        repeatCount="indefinite"
        to="-10"
      />
    </path>
  );
};

export const NetworkGraphLayerSlot = ({
  children,
  className,
  height = VERTICAL_PADDING,
  position,
  width = 160,
}: NetworkGraphLayerSlotProps) => {
  if (!position) {
    return null;
  }

  return (
    <foreignObject
      x={position.x - width / 2}
      y={position.y}
      width={width}
      height={height}
      className="relative"
    >
      <div className={className}>{children}</div>
    </foreignObject>
  );
};

export const NetworkGraphLayer = ({
  children,
  x = 0,
  height = 0,
  topOffset = VERTICAL_PADDING,
}: NetworkGraphLayerProps) => {
  const neurons = layerNeurons(children);
  const slots = layerSlots(children);
  return (
    <g>
      {neurons.map((neuron, index) => {
        const size = sizeFor(neuron);
        return cloneElement(neuron, {
          position: {
            x,
            y: neuronY(index, neurons.length, height, size.height, topOffset),
            ...size,
          },
        });
      })}
      {slots.map((slot) => cloneElement(slot, { position: { x, y: 0 } }))}
    </g>
  );
};

export const NetworkGraph = ({ children }: NetworkGraphProps) => {
  const { ref, size } = useResizeObserver<HTMLDivElement>();

  const graphChildren = Children.toArray(children).filter(isValidElement);

  const layers = graphChildren.filter(
    (child): child is ReactElement<NetworkGraphLayerProps> => child.type === NetworkGraphLayer,
  );

  const connections = graphChildren.filter(
    (child): child is ReactElement<NetworkGraphConnectionProps> =>
      child.type === NetworkGraphConnection,
  );

  const layerWidths = layers.map((layer) =>
    Math.max(...layerNeurons(layer.props.children).map((neuron) => sizeFor(neuron).width), 0),
  );
  const slotHeight = Math.max(
    0,
    ...layers.flatMap((layer) =>
      layerSlots(layer.props.children).map((slot) => slot.props.height ?? 0),
    ),
  );
  const contentTop = slotHeight + VERTICAL_PADDING;
  const graphMinimumHeight = Math.max(
    384,
    ...layers.map((layer) => {
      const neurons = layerNeurons(layer.props.children);
      const tallestNeuron = Math.max(...neurons.map((neuron) => sizeFor(neuron).height), 0);
      return contentTop + VERTICAL_PADDING + NEURON_SPACING * (neurons.length - 1) + tallestNeuron;
    }),
  );

  const availableWidth = Math.max(
    0,
    size.width - HORIZONTAL_PADDING * 2 - layerWidths.reduce((total, width) => total + width, 0),
  );

  const layerGap = layers.length > 1 ? availableWidth / (layers.length - 1) : 0;

  const layerPositions = layerWidths.map(
    (width, index) =>
      HORIZONTAL_PADDING +
      layerWidths.slice(0, index).reduce((total, previousWidth) => total + previousWidth, 0) +
      layerGap * index +
      width / 2,
  );

  const maxWeight = Math.max(
    1e-6,
    ...connections.map((connection) => Math.abs(connection.props.weight)),
  );

  const positions = new Map<string, Position>();

  layers.forEach((layer, layerIndex) => {
    const neurons = layerNeurons(layer.props.children);
    neurons.forEach((neuron, neuronIndex) => {
      const neuronSize = sizeFor(neuron);
      positions.set(neuron.props.id, {
        x: layerPositions[layerIndex],
        y: neuronY(neuronIndex, neurons.length, size.height, neuronSize.height, contentTop),
        ...neuronSize,
      });
    });
  });

  return (
    <div
      ref={ref}
      className="bg-background relative aspect-16/7 min-h-96 w-full overflow-hidden rounded-md border"
      style={{ minHeight: graphMinimumHeight }}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label="Neural network graph"
      >
        <g>
          {connections.map((connection) =>
            cloneElement(connection, {
              fromPosition: positions.get(connection.props.from),
              toPosition: positions.get(connection.props.to),
              maxWeight,
            }),
          )}
        </g>
        <g>
          {layers.map((layer, index) =>
            cloneElement(layer, {
              x: layerPositions[index],
              height: size.height,
              topOffset: contentTop,
            }),
          )}
        </g>
      </svg>
    </div>
  );
};
