import type { ButtonProps } from "@base-ui/react/button";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFieldContext } from "@/lib/form";
import { cn } from "@/lib/utils";

type FormStepperProps = ButtonProps & {
  className?: string;
  disabled?: boolean;
  max?: number;
  min?: number;
  step?: number;
};

export function FormStepper({
  className,
  disabled = false,
  max = Number.POSITIVE_INFINITY,
  min = Number.NEGATIVE_INFINITY,
  step = 1,
  ...props
}: FormStepperProps) {
  const field = useFieldContext<number>();

  const value = field.state.value;

  const setValue = (nextValue: number) => {
    field.handleChange(Math.min(max, Math.max(min, nextValue)));
  };

  return (
    <div data-slot="form-stepper" className={cn("flex items-center gap-1", className)}>
      <Button
        aria-label="Decrease value"
        disabled={disabled || value <= min}
        onClick={() => setValue(value - step)}
        size="icon-sm"
        type="button"
        variant="outline"
        {...props}
      >
        <MinusIcon />
      </Button>
      <output aria-live="polite" className="min-w-4 text-center text-sm tabular-nums">
        {value}
      </output>
      <Button
        aria-label="Increase value"
        disabled={disabled || value >= max}
        onClick={() => setValue(value + step)}
        size="icon-sm"
        type="button"
        variant="outline"
        {...props}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
