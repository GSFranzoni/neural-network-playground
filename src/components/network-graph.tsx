import {
  BaseEdge,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import type { ReactElement, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { Children, isValidElement, memo, useCallback, useMemo } from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { activationFieldDataUrl } from "@/lib/canvas";
import type { ScalarField } from "@/lib/field";

type NodeSize = { width: number; height: number };

type NetworkGraphNeuronProps = {
  id: string;
  children?: ReactNode;
  field?: ScalarField;
  preview?: ReactNode;
  size?: NodeSize;
};

type NetworkGraphConnectionProps = {
  from: string;
  to: string;
  weight: number;
};

type NetworkGraphLayerProps = {
  children: ReactNode;
};

type NetworkGraphLayerSlotProps = {
  children: ReactNode;
  className?: string;
  height?: number;
  width?: number;
};

type NetworkGraphProps = { children: ReactNode };

type NeuronNodeData = Omit<NetworkGraphNeuronProps, "id"> & { size: NodeSize };
type LayerSlotNodeData = Required<Pick<NetworkGraphLayerSlotProps, "height" | "width">> &
  Omit<NetworkGraphLayerSlotProps, "height" | "width">;
type WeightEdgeData = { weight: number; maxWeight: number };

const DEFAULT_NEURON_SIZE = { width: 32, height: 32 };
const DEFAULT_FLOW_WIDTH = 960;
const HORIZONTAL_PADDING = 56;
const VERTICAL_PADDING = 24;
const NEURON_SPACING = 44;

function sizeFor(neuron: ReactElement<NetworkGraphNeuronProps>): NodeSize {
  return neuron.props.size ?? DEFAULT_NEURON_SIZE;
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

const NeuronNode = memo(({ data }: NodeProps<Node<NeuronNodeData, "neuron">>) => {
  const activationMap = useMemo(
    () => (data.field ? activationFieldDataUrl(data.field) : ""),
    [data.field],
  );
  const { width, height } = data.size;

  const content = data.children ? (
    <div className="nodrag nopan h-full w-full overflow-hidden rounded-md">{data.children}</div>
  ) : (
    <div
      className="bg-card h-full w-full overflow-hidden rounded-md border border-current/65"
      style={{ width, height }}
    >
      {activationMap ? (
        <img alt="" className="h-full w-full object-fill" draggable={false} src={activationMap} />
      ) : null}
    </div>
  );

  return (
    <div className="relative h-full w-full">
      <Handle
        isConnectable={false}
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
        type="target"
      />
      {data.preview ? (
        <HoverCard>
          <HoverCardTrigger
            closeDelay={100}
            delay={120}
            render={<div className="nodrag nopan h-full w-full" />}
          >
            {content}
          </HoverCardTrigger>
          <HoverCardContent
            className="pointer-events-none overflow-hidden"
            side="inline-end"
            style={{ padding: 0 }}
          >
            {data.preview}
          </HoverCardContent>
        </HoverCard>
      ) : (
        content
      )}
      <Handle
        isConnectable={false}
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
        type="source"
      />
    </div>
  );
});

const LayerSlotNode = memo(({ data }: NodeProps<Node<LayerSlotNodeData, "layerSlot">>) => (
  <div className={`nodrag nopan pointer-events-auto h-full w-full ${data.className ?? ""}`}>
    {data.children}
  </div>
));

const WeightEdge = memo(({ data, ...edge }: EdgeProps<Edge<WeightEdgeData, "weight">>) => {
  const magnitude = Math.min(Math.abs(data?.weight ?? 0) / (data?.maxWeight ?? 1), 1);
  const color = (data?.weight ?? 0) >= 0 ? "var(--network-positive)" : "var(--network-negative)";
  const controlX = (edge.sourceX + edge.targetX) / 2;
  const path = `M ${edge.sourceX} ${edge.sourceY} C ${controlX} ${edge.sourceY}, ${controlX} ${edge.targetY}, ${edge.targetX} ${edge.targetY}`;

  return (
    <BaseEdge
      interactionWidth={0}
      path={path}
      style={{
        stroke: color,
        strokeDasharray: "3 7",
        strokeLinecap: "round",
        strokeOpacity: 0.4 + magnitude * 0.6,
        strokeWidth: 1.25 + magnitude * 2.5,
      }}
    />
  );
});

const nodeTypes = {
  neuron: NeuronNode,
  layerSlot: LayerSlotNode,
} satisfies NodeTypes;

const edgeTypes = { weight: WeightEdge };

export const NetworkGraphNeuron: (props: NetworkGraphNeuronProps) => null = () => null;

export const NetworkGraphConnection: (props: NetworkGraphConnectionProps) => null = () => null;

export const NetworkGraphLayerSlot: (props: NetworkGraphLayerSlotProps) => null = () => null;

export const NetworkGraphLayer: (props: NetworkGraphLayerProps) => null = () => null;

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

  const { nodes, edges, graphMinimumHeight } = useMemo(() => {
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
        return (
          contentTop + VERTICAL_PADDING + NEURON_SPACING * (neurons.length - 1) + tallestNeuron
        );
      }),
    );
    const flowHeight = Math.max(size.height, graphMinimumHeight);
    const flowWidth = size.width || DEFAULT_FLOW_WIDTH;
    const availableWidth = Math.max(
      0,
      flowWidth - HORIZONTAL_PADDING * 2 - layerWidths.reduce((total, width) => total + width, 0),
    );
    const layerGap = layers.length > 1 ? availableWidth / (layers.length - 1) : 0;
    const layerPositions = layerWidths.map(
      (width, index) =>
        HORIZONTAL_PADDING +
        layerWidths.slice(0, index).reduce((total, previousWidth) => total + previousWidth, 0) +
        layerGap * index +
        width / 2,
    );

    const graphNodes: Node[] = [];
    layers.forEach((layer, layerIndex) => {
      const neurons = layerNeurons(layer.props.children);
      const slots = layerSlots(layer.props.children);
      const centerX = layerPositions[layerIndex];

      slots.forEach((slot, slotIndex) => {
        const width = slot.props.width ?? 160;
        const height = slot.props.height ?? VERTICAL_PADDING;
        graphNodes.push({
          id: `slot-${layerIndex}-${slotIndex}`,
          type: "layerSlot",
          position: { x: centerX - width / 2, y: 0 },
          data: { ...slot.props, width, height },
          style: { width, height },
          draggable: false,
          selectable: false,
          zIndex: 1,
        });
      });

      neurons.forEach((neuron, neuronIndex) => {
        const size = sizeFor(neuron);
        const centerY =
          neurons.length === 1
            ? contentTop + size.height / 2
            : contentTop +
              size.height / 2 +
              neuronIndex *
                Math.max(
                  0,
                  (flowHeight - contentTop - VERTICAL_PADDING - size.height) / (neurons.length - 1),
                );
        graphNodes.push({
          id: neuron.props.id,
          type: "neuron",
          position: { x: centerX - size.width / 2, y: centerY - size.height / 2 },
          data: { ...neuron.props, size },
          width: size.width,
          height: size.height,
          style: size,
          draggable: false,
          selectable: false,
          zIndex: 1,
        });
      });
    });

    const maxWeight = Math.max(
      1e-6,
      ...connections.map((connection) => Math.abs(connection.props.weight)),
    );
    const graphEdges: Edge<WeightEdgeData>[] = connections.map((connection, index) => ({
      id: `connection-${index}-${connection.props.from}-${connection.props.to}`,
      source: connection.props.from,
      target: connection.props.to,
      type: "weight",
      animated: true,
      data: { weight: connection.props.weight, maxWeight },
      focusable: false,
      selectable: false,
      zIndex: 0,
    }));

    return { nodes: graphNodes, edges: graphEdges, graphMinimumHeight };
  }, [connections, layers, size.height, size.width]);

  const enableNodePointerEvents = useCallback(() => {}, []);
  const blockCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest(".react-flow__node")) {
      return;
    }

    event.stopPropagation();
  }, []);

  return (
    <div
      ref={ref}
      className="bg-background relative aspect-16/7 min-h-96 w-full overflow-hidden rounded-md"
      style={{ minHeight: graphMinimumHeight }}
    >
      <ReactFlow
        className="cursor-default [&_.react-flow__pane]:cursor-default"
        edges={edges}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.02 }}
        nodes={nodes}
        nodeTypes={nodeTypes}
        elementsSelectable={false}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        onNodeMouseEnter={enableNodePointerEvents}
        onPointerDownCapture={blockCanvasPointerDown}
        panActivationKeyCode={null}
        panOnDrag={false}
        panOnScroll={false}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        zoomOnScroll={false}
      />
    </div>
  );
};
