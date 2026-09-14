import { useCallback, useRef, useState, type PointerEvent } from "react";

import type { ConnectionTooltipProps } from "./types";

function NetworkGraphConnectionTooltip({ position, tooltipRef, weight }: ConnectionTooltipProps) {
  return (
    <g
      pointerEvents="none"
      ref={tooltipRef}
      style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / 0.14))" }}
      transform={`translate(${position.x} ${position.y})`}
    >
      <rect fill="var(--foreground)" height="24" rx="5" width="104" x="-52" y="-38" />
      <path d="M -5 -14 L 5 -14 L 0 -8 Z" fill="var(--foreground)" />
      <text
        fill="var(--background)"
        fontSize="11"
        style={{ fontVariantNumeric: "tabular-nums" }}
        textAnchor="middle"
        x="0"
        y="-22"
      >
        <tspan fontWeight="700">Weight:</tspan>
        <tspan dx="4">{weight.toFixed(4)}</tspan>
      </text>
    </g>
  );
}

function useConnectionTooltip() {
  const element = useRef<SVGGElement>(null);

  const position = useRef({ x: 0, y: 0 });

  const hoveredConnectionId = useRef<string | null>(null);

  const [id, setId] = useState<string | null>(null);

  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const show = useCallback((connectionId: string, event: PointerEvent<SVGPathElement>) => {
    const svg = event.currentTarget.ownerSVGElement;

    const transform = svg?.getScreenCTM();

    if (!svg || !transform) {
      return;
    }

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const nextPosition = point.matrixTransform(transform.inverse());
    position.current = nextPosition;

    element.current?.setAttribute("transform", `translate(${nextPosition.x} ${nextPosition.y})`);

    if (hoveredConnectionId.current !== connectionId) {
      hoveredConnectionId.current = connectionId;
      setInitialPosition(nextPosition);
      setId(connectionId);
    }
  }, []);

  const hide = useCallback(() => {
    hoveredConnectionId.current = null;
    setId(null);
  }, []);

  return { element, hide, id, initialPosition, show };
}

export { NetworkGraphConnectionTooltip, useConnectionTooltip };
