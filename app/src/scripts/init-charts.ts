import { Chart } from "chart.js/auto";
import { initDonutChart } from "../lib/charts/donut";
import { initLineChartMinimal } from "../lib/charts/line-minimal";
import { initLineChartFull } from "../lib/charts/line-full";
import { initBarChart } from "../lib/charts/bar";
import { initPieChart } from "../lib/charts/pie";

const initters: Record<string, (id: string) => void> = {
  donut: initDonutChart,
  "line-minimal": initLineChartMinimal,
  "line-full": initLineChartFull,
  bar: initBarChart,
  pie: initPieChart,
};

/**
 * Initializes every chart canvas marked with data-chart on the page.
 * Skips canvases that already have a Chart.js instance.
 */
export function initAllCharts(): void {
  for (const canvas of document.querySelectorAll("canvas[data-chart]")) {
    if (!(canvas instanceof HTMLCanvasElement)) continue;
    if (Chart.getChart(canvas)) continue;

    const type = canvas.dataset.chart;
    if (!type || !initters[type]) continue;

    initters[type](canvas.id);
  }
}
