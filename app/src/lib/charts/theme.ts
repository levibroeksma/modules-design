/** Dark-theme Chart.js tokens aligned with the teal/zinc design system. */

export const chartColors = {
  series: ["#2dd4bf", "#5eead4", "#0d9488", "#134e4a", "#99f6e4", "#52525b"],
  accent: "#2dd4bf",
  accentSoft: "rgba(45, 212, 191, 0.12)",
  line: "#2dd4bf",
  lineFill: "rgba(45, 212, 191, 0.08)",
  bar: "#14b8a6",
  barHover: "#2dd4bf",
  fg: "#fafafa",
  fgMuted: "#a1a1aa",
  fgSubtle: "#71717a",
  grid: "rgba(63, 63, 70, 0.35)",
  border: "rgba(82, 82, 91, 0.5)",
} as const;

export const fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif";

/**
 * Snappy ease-out animation — under 300ms per emil-design-eng.
 * Disabled when user prefers reduced motion.
 */
export function getAnimation(): false | { duration: number; easing: "easeOutQuart" } {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return { duration: 250, easing: "easeOutQuart" };
}

export const tooltipDefaults = {
  backgroundColor: "#27272a",
  titleColor: chartColors.fg,
  bodyColor: chartColors.fgMuted,
  borderColor: chartColors.border,
  borderWidth: 1,
  padding: 10,
  cornerRadius: 6,
  displayColors: true,
  boxPadding: 4,
  titleFont: { family: fontFamily, size: 12, weight: "500" as const },
  bodyFont: { family: fontFamily, size: 11 },
};

export const legendDefaults = {
  display: true,
  position: "bottom" as const,
  labels: {
    color: chartColors.fgMuted,
    font: { family: fontFamily, size: 11 },
    padding: 16,
    boxWidth: 8,
    boxHeight: 8,
    useBorderRadius: true,
    borderRadius: 2,
  },
};

export const scaleDefaults = {
  x: {
    grid: { color: chartColors.grid, drawBorder: false },
    ticks: {
      color: chartColors.fgSubtle,
      font: { family: fontFamily, size: 11 },
    },
    border: { display: false },
  },
  y: {
    grid: { color: chartColors.grid, drawBorder: false },
    ticks: {
      color: chartColors.fgSubtle,
      font: { family: fontFamily, size: 11 },
      padding: 8,
    },
    border: { display: false },
  },
};

export const hiddenScaleDefaults = {
  x: { display: false },
  y: { display: false },
};

/** Fixed-size charts — responsive mode causes resize feedback loops. */
export const baseChartOptions = {
  responsive: false,
  maintainAspectRatio: false,
} as const;
