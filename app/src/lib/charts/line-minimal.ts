import { chartColors, baseChartOptions, getAnimation, hiddenScaleDefaults } from "./theme";
import { getCanvas, mountChart } from "./mount";

/**
 * Initializes a sparkline-style line chart — no grid, axes, labels, or legend.
 */
export function initLineChartMinimal(id: string): void {
  const canvas = getCanvas(id);
  if (!canvas) return;

  mountChart(canvas, {
    type: "line",
    data: {
      labels: ["", "", "", "", "", "", "", ""],
      datasets: [
        {
          data: [12, 19, 14, 22, 18, 27, 24, 32],
          borderColor: chartColors.line,
          backgroundColor: chartColors.lineFill,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      animation: getAnimation(),
      layout: { padding: 0 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: hiddenScaleDefaults,
    },
  });
}
