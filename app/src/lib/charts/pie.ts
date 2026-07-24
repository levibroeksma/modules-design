import { chartColors, baseChartOptions, getAnimation, legendDefaults, tooltipDefaults } from "./theme";
import { getCanvas, mountChart } from "./mount";

/**
 * Initializes a pie chart with legend and tooltips.
 */
export function initPieChart(id: string): void {
  const canvas = getCanvas(id);
  if (!canvas) return;

  mountChart(canvas, {
    type: "pie",
    data: {
      labels: ["Desktop", "Mobile", "Tablet", "Other"],
      datasets: [
        {
          data: [48, 36, 11, 5],
          backgroundColor: chartColors.series,
          borderWidth: 0,
          hoverOffset: 4,
          spacing: 1,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      animation: getAnimation(),
      plugins: {
        legend: legendDefaults,
        tooltip: tooltipDefaults,
      },
    },
  });
}
