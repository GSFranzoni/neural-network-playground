import type { ComponentProps } from "react";

import { Slider } from "@/components/ui/slider";
import { useFieldContext } from "@/lib/form";

type FormSliderProps = Omit<ComponentProps<typeof Slider>, "onValueChange" | "value">;

export function FormSlider(props: FormSliderProps) {
  const field = useFieldContext<number[]>();

  return (
    <Slider
      {...props}
      value={field.state.value}
      onValueChange={(value) => field.handleChange(Array.isArray(value) ? value : [value])}
    />
  );
}
