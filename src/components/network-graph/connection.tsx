import type { PointerEvent } from "react";
import { memo, useLayoutEffect, useRef } from "react";

import type { NetworkGraphConnectionProps } from "./types";

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
  onHover,
  onLeave,
  registerPath,
  toPosition,
}: NetworkGraphConnectionProps) {
  const pathElement = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    registerPath?.(id, pathElement.current);
    return () => {
      registerPath?.(id, null);
    };
  }, [id, registerPath]);

  if (!fromPosition || !toPosition) {
    return null;
  }

  const controlX =
    (fromPosition.x + fromPosition.width / 2 + toPosition.x - toPosition.width / 2) / 2;

  const path = `M ${fromPosition.x + fromPosition.width / 2} ${fromPosition.y} C ${controlX} ${fromPosition.y}, ${controlX} ${toPosition.y}, ${toPosition.x - toPosition.width / 2} ${toPosition.y}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        onPointerEnter={(event: PointerEvent<SVGPathElement>) => onHover?.(id, event)}
        onPointerLeave={onLeave}
        onPointerMove={(event: PointerEvent<SVGPathElement>) => onHover?.(id, event)}
        pointerEvents="stroke"
        stroke="transparent"
        strokeWidth="12"
      />
      <path
        d={path}
        data-connection-id={id}
        fill="none"
        pointerEvents="none"
        ref={pathElement}
        strokeDasharray="5 3"
        strokeLinecap="butt"
        style={{ strokeDashoffset: "var(--connection-flow-offset, 0px)" }}
      />
    </g>
  );
}, connectionPropsEqual);
