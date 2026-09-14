import { useEffect, useRef } from "react";

type Props = {
  enabled: boolean;
  intervalMs: number;
  onTick: (time: number, elapsed: number) => void;
};

export function useAnimationFrameInterval({ enabled, intervalMs, onTick }: Props) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    let lastTick: number | null = null;

    const tick = (time: number) => {
      const elapsed = lastTick === null ? 0 : time - lastTick;

      if (lastTick === null || elapsed >= intervalMs) {
        onTickRef.current(time, elapsed);
        lastTick = time;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [enabled, intervalMs]);
}
