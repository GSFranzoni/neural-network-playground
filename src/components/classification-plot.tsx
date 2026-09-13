import type React from "react";
import { useEffect, useMemo, useRef } from "react";

import { useResizeObserver } from "@/hooks/use-resize-observer";
import { classificationColorScale, drawField } from "@/lib/canvas";
import type { ScalarField } from "@/lib/field";
import { cn } from "@/lib/utils";
import { ClassLabel, type Bounds, type Dataset } from "@/types/app";

type Props = {
  bounds: Bounds;
  dataset: Dataset;
  field: ScalarField;
  className?: string;
  compact?: boolean;
};

export const ClassificationPlot: React.FC<Props> = ({
  bounds,
  className,
  compact = false,
  dataset,
  field,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorScale = useMemo(() => classificationColorScale(), []);

  const { ref: containerRef, size } = useResizeObserver<HTMLDivElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) {
      return;
    }
    drawField(canvas, field, colorScale, size);
  }, [colorScale, field, size]);

  const toScreenX = (x: number) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * size.width;

  const toScreenY = (y: number) => ((bounds.maxY - y) / (bounds.maxY - bounds.minY)) * size.height;

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-background relative w-full overflow-hidden rounded-md border",
        compact ? "h-full min-h-0 aspect-auto" : "aspect-4/3 min-h-64",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-label="Network decision surface"
      />
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
              fill={
                point.label === ClassLabel.A ? "var(--classification-a)" : "var(--classification-b)"
              }
              stroke="var(--background)"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
