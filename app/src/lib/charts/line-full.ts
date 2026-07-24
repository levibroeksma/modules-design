import { chartColors, baseChartOptions, getAnimation, legendDefaults, scaleDefaults, tooltipDefaults } from "./theme";
import { getCanvas, mountChart } from "./mount";

/**
 * Initializes a line chart with grid, axis labels, legend, and tooltips.
 */
export function initLineChartFull(id: string): void {
  const canvas = getCanvas(id);
  if (!canvas) return;

  mountChart(canvas, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Requests",
          data: [420, 510, 480, 620, 590, 710, 680],
          borderColor: chartColors.line,
          backgroundColor: chartColors.lineFill,
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: chartColors.accent,
          pointBorderColor: chartColors.accent,
          pointHoverRadius: 5,
        },
        {
          label: "Errors",
          data: [12, 8, 15, 10, 7, 9, 6],
          borderColor: chartColors.fgSubtle,
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: chartColors.fgSubtle,
          pointBorderColor: chartColors.fgSubtle,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      animation: getAnimation(),
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: legendDefaults,
        tooltip: tooltipDefaults,
      },
      scales: scaleDefaults,
    },
  });
}
