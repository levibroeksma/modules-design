import { chartColors, baseChartOptions, getAnimation, tooltipDefaults } from "./theme";
import { getCanvas, mountChart } from "./mount";

/**
 * Initializes a minimal donut chart with no legend.
 */
export function initDonutChart(id: string): void {
  const canvas = getCanvas(id);
  if (!canvas) return;

  mountChart(canvas, {
    type: "doughnut",
    data: {
      labels: ["API", "Database", "Auth", "Storage"],
      datasets: [
        {
          data: [42, 28, 18, 12],
          backgroundColor: chartColors.series,
          borderWidth: 0,
          hoverOffset: 4,
          spacing: 2,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      animation: getAnimation(),
      plugins: {
        legend: { display: false },
        tooltip: tooltipDefaults,
      },
      cutout: "72%",
    },
  });
}
