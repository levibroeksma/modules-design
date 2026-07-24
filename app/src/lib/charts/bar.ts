import { chartColors, baseChartOptions, getAnimation, legendDefaults, scaleDefaults, tooltipDefaults } from "./theme";
import { getCanvas, mountChart } from "./mount";

/**
 * Initializes a bar chart with grid, labels, legend, and tooltips.
 */
export function initBarChart(id: string): void {
  const canvas = getCanvas(id);
  if (!canvas) return;

  mountChart(canvas, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Sign ups",
          data: [120, 190, 150, 220, 180, 260],
          backgroundColor: chartColors.bar,
          hoverBackgroundColor: chartColors.barHover,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "Active",
          data: [80, 140, 110, 170, 150, 200],
          backgroundColor: chartColors.accentSoft,
          hoverBackgroundColor: "rgba(45, 212, 191, 0.22)",
          borderRadius: 4,
          borderSkipped: false,
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
      scales: {
        ...scaleDefaults,
        x: {
          ...scaleDefaults.x,
          grid: { display: false },
        },
      },
    },
  });
}
