import { useEffect, useRef } from "react";

type Props = {
  enabled: boolean;
  intervalMs: number;
  onTick: () => void;
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
    let lastTick = 0;

    const tick = (time: number) => {
      if (time - lastTick >= intervalMs) {
        onTickRef.current();
        lastTick = time;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [enabled, intervalMs]);
}
