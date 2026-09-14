import type { NetworkGraphLayerSlotProps } from "./types";

export function NetworkGraphLayerSlot({
  children,
  className,
  height = 24,
  position,
  width = 160,
}: NetworkGraphLayerSlotProps) {
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
}
