import type { ComponentProps } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldContext } from "@/lib/form";

type FormSelectProps = Omit<ComponentProps<typeof Select>, "onValueChange" | "value">;

export function FormSelect({ children, ...props }: FormSelectProps) {
  const field = useFieldContext<string>();

  return (
    <Select
      {...props}
      value={field.state.value}
      onValueChange={(value) => field.handleChange(value == null ? "" : String(value))}
    >
      {children}
    </Select>
  );
}

FormSelect.Content = SelectContent;
FormSelect.Group = SelectGroup;
FormSelect.Item = SelectItem;
FormSelect.Label = SelectLabel;
FormSelect.Separator = SelectSeparator;
FormSelect.Trigger = SelectTrigger;
FormSelect.Value = SelectValue;
