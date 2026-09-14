import type { KeyboardEvent } from "react";
import { useId, useMemo } from "react";

import { activationFieldDataUrl } from "@/lib/canvas";
import { cn } from "@/lib/utils";

import { DEFAULT_LEFT_SLOT_WIDTH } from "./constants";
import type { NetworkGraphNeuronProps } from "./types";

export function NetworkGraphNeuron({
  children,
  field,
  isSelectable = false,
  isSelected = false,
  leftSlot,
  leftSlotWidth = DEFAULT_LEFT_SLOT_WIDTH,
  onSelect,
  position,
}: NetworkGraphNeuronProps) {
  const clipId = useId();

  const activationMap = useMemo(() => (field ? activationFieldDataUrl(field) : ""), [field]);

  if (!position) {
    return null;
  }

  const { width, height } = position;

  const left = position.x - width / 2;
  const top = position.y - height / 2;

  const handleKeyDown = (event: KeyboardEvent<SVGElement>) => {
    if (!isSelectable || !onSelect || (event.key !== "Enter" && event.key !== " ")) {
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
        className={cn(isSelectable && "cursor-pointer focus:outline-none", selectionClassName)}
        x={left}
        y={top}
        width={width}
        height={height}
      >
        <div className={cn("h-full w-full", isSelectable && "transition-opacity")}>{children}</div>
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
      {leftSlot && (
        <foreignObject x={left - leftSlotWidth} y={top} width={leftSlotWidth} height={height}>
          <div className="text-muted-foreground flex h-full items-center justify-end pr-2 text-xs">
            {leftSlot}
          </div>
        </foreignObject>
      )}
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={width} height={height} rx="5" />
        </clipPath>
      </defs>
      <rect x={left} y={top} width={width} height={height} rx="5" fill="var(--card)" />
      {activationMap && (
        <image
          clipPath={`url(#${clipId})`}
          height={height}
          href={activationMap}
          preserveAspectRatio="none"
          width={width}
          x={left}
          y={top}
        />
      )}
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
}
