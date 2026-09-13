import type { ComponentProps } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFieldContext } from "@/lib/form";

type FormToggleGroupProps = Omit<ComponentProps<typeof ToggleGroup>, "onValueChange" | "value">;

export function FormToggleGroup({ children, ...props }: FormToggleGroupProps) {
  const field = useFieldContext<string[]>();

  return (
    <ToggleGroup {...props} value={field.state.value} onValueChange={field.handleChange}>
      {children}
    </ToggleGroup>
  );
}

FormToggleGroup.Item = ToggleGroupItem;
