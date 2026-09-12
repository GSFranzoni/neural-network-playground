import { useLayoutEffect, useRef, useState } from "react";

export type ElementSize = {
  width: number;
  height: number;
};

export function useResizeObserver<T extends Element>() {
  const ref = useRef<T>(null);

  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();

      const nextSize = { width: Math.round(width), height: Math.round(height) };

      setSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
