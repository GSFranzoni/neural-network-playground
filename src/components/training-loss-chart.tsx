import { Area, AreaChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrainingPoint } from "@/hooks/use-training";

type Props = {
  data: TrainingPoint[];
};

const chartConfig = {
  loss: {
    label: "Loss",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function TrainingLossChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="loss"
          fill="var(--color-loss)"
          fillOpacity={0.2}
          stroke="var(--color-loss)"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  );
}
