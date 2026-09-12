import type { ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement, useId } from "react";

import { useResizeObserver } from "@/hooks/use-resize-observer";
import type { ScalarField } from "@/lib/field";

type Position = {
  x: number;
  y: number;
};

type NetworkGraphNeuronProps = {
  id: string;
  field?: ScalarField;
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
  verticalPadding?: number;
};

type NetworkGraphProps = {
  children: ReactNode;
};

const NEURON_SIZE = 32;

const HORIZONTAL_PADDING = 32;

const VERTICAL_PADDING = 24;

function neuronY(index: number, count: number, height: number, padding: number): number {
  if (count === 1) {
    return height / 2;
  }

  return padding + (index * (height - padding * 2)) / (count - 1);
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

export const NetworkGraphNeuron = ({ field, position }: NetworkGraphNeuronProps) => {
  const clipId = useId();

  if (!position) {
    return null;
  }

  const left = position.x - NEURON_SIZE / 2;

  const top = position.y - NEURON_SIZE / 2;

  const cellWidth = field?.values[0]?.length ? NEURON_SIZE / field.values[0].length : 0;
  const cellHeight = field?.values.length ? NEURON_SIZE / field.values.length : 0;
  const cells = field ? activationCells(field) : [];

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={NEURON_SIZE} height={NEURON_SIZE} rx="5" />
        </clipPath>
      </defs>
      <rect x={left} y={top} width={NEURON_SIZE} height={NEURON_SIZE} rx="5" fill="var(--card)" />
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
        width={NEURON_SIZE}
        height={NEURON_SIZE}
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

  const controlX = (fromPosition.x + toPosition.x) / 2;

  const color = weight >= 0 ? "var(--network-positive)" : "var(--network-negative)";

  const pulseDuration = `${(1.8 - magnitude * 0.9).toFixed(2)}s`;

  const path = `M ${fromPosition.x + NEURON_SIZE / 2} ${fromPosition.y} C ${controlX} ${fromPosition.y}, ${controlX} ${toPosition.y}, ${toPosition.x - NEURON_SIZE / 2} ${toPosition.y}`;

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
        dur={pulseDuration}
        from="0"
        repeatCount="indefinite"
        to="-10"
      />
    </path>
  );
};

export const NetworkGraphLayer = ({
  children,
  x = 0,
  height = 0,
  verticalPadding = 0,
}: NetworkGraphLayerProps) => {
  const neurons = layerNeurons(children);

  return (
    <g>
      {neurons.map((neuron, index) =>
        cloneElement(neuron, {
          position: {
            x,
            y: neuronY(index, neurons.length, height, verticalPadding),
          },
        }),
      )}
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

  const layerPositions = layers.map((_, index) => {
    const availableWidth = Math.max(size.width - HORIZONTAL_PADDING * 2, 0);
    const step = layers.length > 1 ? availableWidth / (layers.length - 1) : 0;
    return HORIZONTAL_PADDING + index * step;
  });

  const maxWeight = Math.max(
    1e-6,
    ...connections.map((connection) => Math.abs(connection.props.weight)),
  );

  const positions = new Map<string, Position>();

  layers.forEach((layer, layerIndex) => {
    const neurons = layerNeurons(layer.props.children);
    neurons.forEach((neuron, neuronIndex) => {
      positions.set(neuron.props.id, {
        x: layerPositions[layerIndex],
        y: neuronY(neuronIndex, neurons.length, size.height, VERTICAL_PADDING),
      });
    });
  });

  return (
    <div
      ref={ref}
      className="bg-background relative aspect-16/7 min-h-80 w-full overflow-hidden rounded-md border"
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
              verticalPadding: VERTICAL_PADDING,
            }),
          )}
        </g>
      </svg>
    </div>
  );
};
