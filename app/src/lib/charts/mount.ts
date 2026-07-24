import { Chart, type ChartConfiguration } from "chart.js/auto";

/**
 * Sizes a canvas to its parent width and declared height before Chart.js mounts.
 */
function sizeCanvas(canvas: HTMLCanvasElement): void {
  const frame = canvas.parentElement;
  const height = Number(canvas.dataset.height ?? canvas.getAttribute("height") ?? 200);
  const width = frame?.clientWidth ?? canvas.clientWidth;

  canvas.height = height;
  canvas.width = width > 0 ? width : 300;
  canvas.style.height = `${height}px`;
  canvas.style.width = "100%";
  canvas.style.maxWidth = "100%";
}

/**
 * Mounts a Chart.js instance once per canvas — skips if already initialized.
 */
export function mountChart(canvas: HTMLCanvasElement, config: ChartConfiguration): Chart {
  const existing = Chart.getChart(canvas);
  if (existing) return existing;

  sizeCanvas(canvas);
  return new Chart(canvas, config);
}

/**
 * Resolves a canvas element by id or returns null if missing.
 */
export function getCanvas(id: string): HTMLCanvasElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLCanvasElement ? el : null;
}
