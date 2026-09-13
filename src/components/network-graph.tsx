import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { useResizeObserver } from "@/hooks/use-resize-observer";
import { activationFieldDataUrl } from "@/lib/canvas";
import type { ScalarField } from "@/lib/field";
import { cn } from "@/lib/utils";

type NodeSize = { width: number; height: number };

type Position = NodeSize & { x: number; y: number };

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

type NetworkGraphConnectionProps = {
  id: string;
  from: string;
  to: string;
  weight: number;
  maxWeight?: number;
  fromPosition?: Position;
  toPosition?: Position;
  registerPath?: (id: string, element: SVGPathElement | null) => void;
};

type NetworkGraphLayerProps = {
  children: ReactNode;
  width?: number;
  x?: number;
  topOffset?: number;
};

type NetworkGraphLayerSlotProps = {
  children: ReactNode;
  className?: string;
  height?: number;
  position?: { x: number; y: number };
  width?: number;
};

type NetworkGraphProps = { children: ReactNode; iteration?: number };

const DEFAULT_NEURON_SIZE = { width: 32, height: 32 };
const HORIZONTAL_PADDING = 32;
const VERTICAL_PADDING = 24;
const NEURON_SPACING = 52;
const DEFAULT_LEFT_SLOT_WIDTH = 72;

function neuronY(
  index: number,
  neuronHeight: number,
  topOffset: number,
): number {
  return topOffset + neuronHeight / 2 + index * NEURON_SPACING;
}

function sizeFor(neuron: ReactElement<NetworkGraphNeuronProps>): NodeSize {
  return neuron.props.size ?? DEFAULT_NEURON_SIZE;
}

function leftSlotWidthFor(
  neuron: ReactElement<NetworkGraphNeuronProps>,
): number {
  return neuron.props.leftSlot
    ? (neuron.props.leftSlotWidth ?? DEFAULT_LEFT_SLOT_WIDTH)
    : 0;
}

function layerNeurons(
  children: ReactNode,
): ReactElement<NetworkGraphNeuronProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphNeuronProps> =>
      isValidElement<NetworkGraphNeuronProps>(child) &&
      child.type === NetworkGraphNeuron,
  );
}

function layerSlots(
  children: ReactNode,
): ReactElement<NetworkGraphLayerSlotProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<NetworkGraphLayerSlotProps> =>
      isValidElement<NetworkGraphLayerSlotProps>(child) &&
      child.type === NetworkGraphLayerSlot,
  );
}

export const NetworkGraphNeuron = ({
  children,
  field,
  isSelectable = false,
  isSelected = false,
  leftSlot,
  leftSlotWidth = DEFAULT_LEFT_SLOT_WIDTH,
  onSelect,
  position,
}: NetworkGraphNeuronProps) => {
  const clipId = useId();
  const activationMap = useMemo(
    () => (field ? activationFieldDataUrl(field) : ""),
    [field],
  );
  if (!position) {
    return null;
  }

  const { width, height } = position;
  const left = position.x - width / 2;
  const top = position.y - height / 2;
  const handleKeyDown = (event: KeyboardEvent<SVGElement>) => {
    if (
      !isSelectable ||
      !onSelect ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onSelect();
  };
  const selectableProps = isSelectable
    ? {
        "aria-pressed": isSelected,
        onClick: onSelect,
        onKeyDown: handleKeyDown,
        role: "button",
        tabIndex: 0,
      }
    : {};
  const selectionClassName = isSelectable
    ? isSelected
      ? "opacity-100"
      : "opacity-35 hover:opacity-75"
    : undefined;

  if (children) {
    return (
      <foreignObject
        {...selectableProps}
        className={cn(
          isSelectable && "cursor-pointer focus:outline-none",
          selectionClassName,
        )}
        x={left}
        y={top}
        width={width}
        height={height}
      >
        <div
          className={cn("h-full w-full", isSelectable && "transition-opacity")}
        >
          {children}
        </div>
      </foreignObject>
    );
  }

  return (
    <g
      {...selectableProps}
      className={cn(
        isSelectable && "cursor-pointer transition-opacity focus:outline-none",
        selectionClassName,
      )}
    >
      {leftSlot ? (
        <foreignObject
          x={left - leftSlotWidth}
          y={top}
          width={leftSlotWidth}
          height={height}
        >
          <div className="text-muted-foreground flex h-full items-center justify-end pr-2 text-xs">
            {leftSlot}
          </div>
        </foreignObject>
      ) : null}
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={width} height={height} rx="5" />
        </clipPath>
      </defs>
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx="5"
        fill="var(--card)"
      />
      {activationMap ? (
        <image
          clipPath={`url(#${clipId})`}
          height={height}
          href={activationMap}
          preserveAspectRatio="none"
          width={width}
          x={left}
          y={top}
        />
      ) : null}
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

function updateConnectionVisuals(
  iteration: number,
  connections: ReactElement<NetworkGraphConnectionProps>[],
  pathElements: ReadonlyMap<string, SVGPathElement>,
  maxWeight: number,
) {
  for (const connection of connections) {
    const path = pathElements.get(connection.props.id);

    if (!path) {
      continue;
    }

    const magnitude = Math.min(
      Math.abs(connection.props.weight) / maxWeight,
      1,
    );

    path.style.stroke =
      connection.props.weight >= 0
        ? "var(--network-positive)"
        : "var(--network-negative)";
    path.style.strokeDashoffset = `${-iteration / 3}`;
    path.style.strokeOpacity = `${0.4 + magnitude * 0.6}`;
    path.style.strokeWidth = `${1.25 + magnitude * 2.5}`;
  }
}

function connectionPropsEqual(
  previous: NetworkGraphConnectionProps,
  next: NetworkGraphConnectionProps,
) {
  return (
    previous.id === next.id &&
    previous.registerPath === next.registerPath &&
    previous.fromPosition?.x === next.fromPosition?.x &&
    previous.fromPosition?.y === next.fromPosition?.y &&
    previous.toPosition?.x === next.toPosition?.x &&
    previous.toPosition?.y === next.toPosition?.y
  );
}

export const NetworkGraphConnection = memo(function NetworkGraphConnection({
  id,
  fromPosition,
  registerPath,
  toPosition,
}: NetworkGraphConnectionProps) {
  const pathElement = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    registerPath?.(id, pathElement.current);

    return () => registerPath?.(id, null);
  }, [id, registerPath]);

  if (!fromPosition || !toPosition) {
    return null;
  }

  const controlX =
    (fromPosition.x +
      fromPosition.width / 2 +
      toPosition.x -
      toPosition.width / 2) /
    2;

  const path = `M ${fromPosition.x + fromPosition.width / 2} ${fromPosition.y} C ${controlX} ${fromPosition.y}, ${controlX} ${toPosition.y}, ${toPosition.x - toPosition.width / 2} ${toPosition.y}`;

  return (
    <path
      d={path}
      data-connection-id={id}
      fill="none"
      ref={pathElement}
      strokeDasharray="5 3"
      strokeLinecap="butt"
    />
  );
}, connectionPropsEqual);

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
  width,
  x = 0,
  topOffset = VERTICAL_PADDING,
}: NetworkGraphLayerProps) => {
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
      {slots.map((slot) =>
        cloneElement(slot, { position: { x, y: VERTICAL_PADDING } }),
      )}
    </g>
  );
};

export const NetworkGraph = ({
  children,
  iteration = 0,
}: NetworkGraphProps) => {
  const { ref, size } = useResizeObserver<HTMLDivElement>();
  const connectionElements = useRef(new Map<string, SVGPathElement>());
  const connectionsRef = useRef<ReactElement<NetworkGraphConnectionProps>[]>(
    [],
  );
  const frame = useRef<number | null>(null);

  const graphChildren = Children.toArray(children).filter(isValidElement);

  const layers = graphChildren.filter(
    (child): child is ReactElement<NetworkGraphLayerProps> =>
      child.type === NetworkGraphLayer,
  );

  const connections = graphChildren.filter(
    (child): child is ReactElement<NetworkGraphConnectionProps> =>
      child.type === NetworkGraphConnection,
  );

  const layerWidths = layers.map((layer) =>
    Math.max(
      ...layerNeurons(layer.props.children).map(
        (neuron) => sizeFor(neuron).width + leftSlotWidthFor(neuron),
      ),
      0,
    ),
  );
  const layerLeftSlotWidths = layers.map((layer) =>
    Math.max(...layerNeurons(layer.props.children).map(leftSlotWidthFor), 0),
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
      const tallestNeuron = Math.max(
        ...neurons.map((neuron) => sizeFor(neuron).height),
        0,
      );
      return (
        contentTop +
        VERTICAL_PADDING +
        NEURON_SPACING * (neurons.length - 1) +
        tallestNeuron
      );
    }),
  );

  const availableWidth = Math.max(
    0,
    size.width -
      HORIZONTAL_PADDING * 2 -
      layerWidths.reduce((total, width) => total + width, 0),
  );

  const layerGap = layers.length > 1 ? availableWidth / (layers.length - 1) : 0;

  const layerPositions = layerWidths.map(
    (width, index) =>
      HORIZONTAL_PADDING +
      layerWidths
        .slice(0, index)
        .reduce((total, previousWidth) => total + previousWidth, 0) +
      layerGap * index +
      width / 2,
  );

  const maxWeight = Math.max(
    1e-6,
    ...connections.map((connection) => Math.abs(connection.props.weight)),
  );
  const connectionTopology = connections
    .map((connection) => connection.props.id)
    .join("|");

  const setConnectionElement = useCallback(
    (id: string, element: SVGPathElement | null) => {
      if (element) {
        connectionElements.current.set(id, element);
        return;
      }

      connectionElements.current.delete(id);
    },
    [],
  );

  useLayoutEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useLayoutEffect(() => {
    frame.current = requestAnimationFrame(() => {
      updateConnectionVisuals(
        iteration,
        connectionsRef.current,
        connectionElements.current,
        maxWeight,
      );
      frame.current = null;
    });

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [connectionTopology, iteration, maxWeight]);

  const positions = new Map<string, Position>();

  layers.forEach((layer, layerIndex) => {
    const neurons = layerNeurons(layer.props.children);
    neurons.forEach((neuron, neuronIndex) => {
      const neuronSize = sizeFor(neuron);
      positions.set(neuron.props.id, {
        x:
          layerPositions[layerIndex] -
          layerWidths[layerIndex] / 2 +
          layerLeftSlotWidths[layerIndex] +
          neuronSize.width / 2,
        y: neuronY(neuronIndex, neuronSize.height, contentTop),
        ...neuronSize,
      });
    });
  });

  return (
    <div
      ref={ref}
      className="bg-background relative aspect-16/7 min-h-96 w-full overflow-hidden rounded-md"
      style={{ minHeight: graphMinimumHeight }}
    >
      <svg
        className="block size-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label="Neural network graph"
      >
        <g>
          {connections.map(({ props: connection }) => (
            <NetworkGraphConnection
              key={connection.id}
              {...connection}
              fromPosition={positions.get(connection.from)}
              registerPath={setConnectionElement}
              toPosition={positions.get(connection.to)}
              maxWeight={maxWeight}
            />
          ))}
        </g>
        <g>
          {layers.map((layer, index) =>
            cloneElement(layer, {
              width: layerWidths[index],
              x: layerPositions[index],
              topOffset: contentTop,
            }),
          )}
        </g>
      </svg>
    </div>
  );
};
