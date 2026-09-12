import type React from "react";
import { useEffect, useRef } from "react";

import { useResizeObserver } from "@/hooks/use-resize-observer";
import { drawDecisionSurface } from "@/lib/canvas";
import type { NeuralNetwork } from "@/lib/neural-network";
import { ClassLabel, type Bounds, type Dataset } from "@/types/app";

type Props = {
  network: NeuralNetwork;
  bounds: Bounds;
  dataset: Dataset;
};

export const ClassificationPlot: React.FC<Props> = ({ network, bounds, dataset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { ref: containerRef, size } = useResizeObserver<HTMLDivElement>();

  const networkVersion = network
    .export()
    .map((parameter) => parameter.join(","))
    .join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) {
      return;
    }
    drawDecisionSurface(canvas, network, bounds, size);
  }, [network, networkVersion, bounds, size]);

  const toScreenX = (x: number) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * size.width;

  const toScreenY = (y: number) => ((bounds.maxY - y) / (bounds.maxY - bounds.minY)) * size.height;

  return (
    <div
      ref={containerRef}
      className="bg-background relative aspect-4/3 min-h-64 w-full overflow-hidden rounded-md border"
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-label="Network decision surface" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label="Classification data and axes"
      >
        <g>
          {dataset.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={toScreenX(point.x)}
              cy={toScreenY(point.y)}
              r="4"
              fill={point.label === ClassLabel.A ? "#ef5350" : "#4285f4"}
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
