import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

import { useAnimationFrameInterval } from "@/hooks/use-animation-frame-interval";
import { useResizeObserver } from "@/hooks/use-resize-observer";

import { NetworkGraphConnection } from "./connection";
import {
  CONNECTION_FLOW_SPEED,
  HORIZONTAL_PADDING,
  NEURON_SPACING,
  VERTICAL_PADDING,
} from "./constants";
import { NetworkGraphLayer } from "./layer";
import { NetworkGraphNeuron } from "./neuron";
import { NetworkGraphConnectionTooltip, useConnectionTooltip } from "./tooltip";
import type {
  NetworkGraphConnectionElement,
  NetworkGraphLayerProps,
  NetworkGraphProps,
  Position,
} from "./types";
import { layerNeurons, layerSlots, leftSlotWidthFor, neuronY, sizeFor } from "./utils";

function updateConnectionVisuals(
  connections: NetworkGraphConnectionElement[],
  paths: ReadonlyMap<string, SVGPathElement>,
) {
  const maxWeight = Math.max(
    1e-6,
    ...connections.map((connection) => Math.abs(connection.props.weight)),
  );
  for (const connection of connections) {
    const path = paths.get(connection.props.id);
    if (!path) {
      continue;
    }
    const magnitude = Math.min(Math.abs(connection.props.weight) / maxWeight, 1);
    path.style.stroke =
      connection.props.weight >= 0 ? "var(--network-positive)" : "var(--network-negative)";
    path.style.strokeOpacity = `${0.4 + magnitude * 0.6}`;
    path.style.strokeWidth = `${1.25 + magnitude * 2.5}`;
    path.setAttribute("aria-label", `Weight: ${connection.props.weight.toFixed(4)}`);
  }
}

export const NetworkGraph = memo(
  function NetworkGraph({ children, isRunning, iteration = 0 }: NetworkGraphProps) {
    const { ref, size } = useResizeObserver<HTMLDivElement>();

    const pathElements = useRef(new Map<string, SVGPathElement>());

    const connectionsRef = useRef<NetworkGraphConnectionElement[]>([]);

    const frame = useRef<number | null>(null);

    const flowGroup = useRef<SVGGElement>(null);

    const flowOffset = useRef(0);

    const tooltip = useConnectionTooltip();

    const graphChildren = Children.toArray(children).filter(isValidElement);

    const layers = graphChildren.filter(
      (child): child is React.ReactElement<NetworkGraphLayerProps> =>
        child.type === NetworkGraphLayer,
    );

    const connections = graphChildren.filter(
      (child): child is NetworkGraphConnectionElement => child.type === NetworkGraphConnection,
    );

    const layerWidths = layers.map((layer) =>
      Math.max(
        ...layerNeurons(layer.props.children).map(
          (neuron) => sizeFor(neuron).width + leftSlotWidthFor(neuron),
        ),
        0,
      ),
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
        const tallest = Math.max(...neurons.map((neuron) => sizeFor(neuron).height), 0);
        return contentTop + VERTICAL_PADDING + NEURON_SPACING * (neurons.length - 1) + tallest;
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
        layerWidths.slice(0, index).reduce((total, previous) => total + previous, 0) +
        layerGap * index +
        width / 2,
    );

    const layerLeftSlotWidths = layers.map((layer) =>
      Math.max(...layerNeurons(layer.props.children).map(leftSlotWidthFor), 0),
    );

    const connectionTopology = connections.map((connection) => connection.props.id).join("|");

    const setPath = useCallback((id: string, element: SVGPathElement | null) => {
      if (element) {
        pathElements.current.set(id, element);
      } else {
        pathElements.current.delete(id);
      }
    }, []);

    useLayoutEffect(() => {
      connectionsRef.current = connections;
    }, [connections]);

    useLayoutEffect(() => {
      frame.current = requestAnimationFrame(() => {
        updateConnectionVisuals(connectionsRef.current, pathElements.current);
        frame.current = null;
      });
      return () => {
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
        }
      };
    }, [connectionTopology, iteration]);

    useAnimationFrameInterval({
      enabled: isRunning,
      intervalMs: 0,
      onTick: (_, elapsed) => {
        flowOffset.current -= elapsed * CONNECTION_FLOW_SPEED;
        flowGroup.current?.style.setProperty("--connection-flow-offset", `${flowOffset.current}px`);
      },
    });

    const positions = new Map<string, Position>();

    layers.forEach((layer, layerIndex) =>
      layerNeurons(layer.props.children).forEach((neuron, neuronIndex) => {
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
      }),
    );

    const hoveredConnection = connections.find((connection) => connection.props.id === tooltip.id);

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
          <g ref={flowGroup}>
            {connections.map(({ props: connection }) => (
              <NetworkGraphConnection
                key={connection.id}
                {...connection}
                fromPosition={positions.get(connection.from)}
                onHover={tooltip.show}
                onLeave={tooltip.hide}
                registerPath={setPath}
                toPosition={positions.get(connection.to)}
              />
            ))}
            {hoveredConnection && (
              <NetworkGraphConnectionTooltip
                position={tooltip.initialPosition}
                tooltipRef={tooltip.element}
                weight={hoveredConnection.props.weight}
              />
            )}
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
  },
  (previous, next) =>
    previous.isRunning === next.isRunning &&
    previous.iteration === next.iteration &&
    previous.memoKey === next.memoKey,
);

export { NetworkGraphLayerSlot } from "./layer-slot";
export type { NetworkGraphNeuronProps } from "./types";
export { NetworkGraphConnection, NetworkGraphLayer, NetworkGraphNeuron };
