import {
    Chart,
    ChartConfiguration,
    ChartData,
    ChartDataset,
    ChartOptions,
    Title,
    Tooltip,
    Legend,
    Filler,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    PointElement,
    LineController,
    ArcElement,
    PieController,
    DoughnutController,
  } from "chart.js";
  import ChartDataLabels from "chartjs-plugin-datalabels";
  
  // Register only what's needed — keeps tree-shaking intact for unused chart types
  // if you strip the ones you don't use from this list.
  Chart.register(
    Title,
    Tooltip,
    Legend,
    Filler,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    PointElement,
    LineController,
    ArcElement,
    PieController,
    DoughnutController,
    ChartDataLabels
  );
  
  export type PublicChartType = "pie" | "donut" | "bar" | "line";
  type InternalChartType = "pie" | "doughnut" | "bar" | "line";
  
  export interface ChartDatasetInput {
    label: string;
    data: number[];
    /** Single color (bar/line) or array of colors (pie/donut slices). Falls back to default palette. */
    color?: string | string[];
  }
  
  export interface ChartBuilderOptions {
    /** Parent element the chart will fill. Must have a defined height via CSS. */
    container: HTMLElement;
    type: PublicChartType;
    labels: string[];
    datasets: ChartDatasetInput[];
    title?: string;
    showLegend?: boolean;
    showTooltips?: boolean;
    /** Bar/line only. Ignored for pie/donut. */
    showGridLines?: boolean;
    /** Bar/line only. Controls axis tick text. */
    showAxisLabels?: boolean;
    /** Value labels rendered on bars/slices/points. Requires chartjs-plugin-datalabels. */
    showDataLabels?: boolean;
    /** Overrides the default color palette. */
    colors?: string[];
  }
  
  const DEFAULT_COLORS: readonly string[] = [
    "#4E79A7",
    "#F28E2B",
    "#E15759",
    "#76B7B2",
    "#59A14F",
    "#EDC948",
    "#B07AA1",
    "#FF9DA7",
  ];
  
  const DEFAULTS: Required
    Pick
      ChartBuilderOptions,
      "showLegend" | "showTooltips" | "showGridLines" | "showAxisLabels" | "showDataLabels"
    >
  > = {
    showLegend: true,
    showTooltips: true,
    showGridLines: true,
    showAxisLabels: true,
    showDataLabels: false,
  };
  
  export class ChartBuilder {
    private chart: Chart;
    private canvas: HTMLCanvasElement;
    private wrapper: HTMLDivElement;
    private options: ChartBuilderOptions & typeof DEFAULTS;
  
    constructor(options: ChartBuilderOptions) {
      this.options = { ...DEFAULTS, ...options };
  
      this.wrapper = document.createElement("div");
      this.wrapper.style.position = "relative";
      this.wrapper.style.width = "100%";
      this.wrapper.style.height = "100%";
  
      this.canvas = document.createElement("canvas");
      this.wrapper.appendChild(this.canvas);
      this.options.container.appendChild(this.wrapper);
  
      this.chart = this.build();
    }
  
    private toInternalType(type: PublicChartType): InternalChartType {
      return type === "donut" ? "doughnut" : type;
    }
  
    private isCartesian(type: PublicChartType): boolean {
      return type === "bar" || type === "line";
    }
  
    private isSliceType(type: PublicChartType): boolean {
      return type === "pie" || type === "donut";
    }
  
    private resolveColors(count: number, override?: string | string[]): string[] {
      if (Array.isArray(override)) return override;
      const palette = this.options.colors ?? DEFAULT_COLORS;
      if (typeof override === "string") return [override];
      return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
    }
  
    private buildDatasets(): ChartDataset[] {
      const { type, labels, datasets } = this.options;
      const sliceType = this.isSliceType(type);
  
      return datasets.map((ds, i) => {
        const colors = sliceType
          ? this.resolveColors(labels.length, ds.color)
          : this.resolveColors(datasets.length, ds.color)[i % this.resolveColors(datasets.length, ds.color).length];
  
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: sliceType ? colors : (colors as unknown as string),
          borderColor: sliceType ? colors : (colors as unknown as string),
          borderWidth: 1,
        } as ChartDataset;
      });
    }
  
    private buildOptions(): ChartOptions {
      const { type, title } = this.options;
      const cartesian = this.isCartesian(type);
  
      const chartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.options.showLegend },
          title: { display: !!title, text: title ?? "" },
          tooltip: { enabled: this.options.showTooltips },
          // @ts-expect-error -- datalabels typing comes from the plugin, not chart.js core
          datalabels: { display: this.options.showDataLabels },
        },
      };
  
      if (cartesian) {
        chartOptions.scales = {
          x: {
            grid: { display: this.options.showGridLines },
            ticks: { display: this.options.showAxisLabels },
          },
          y: {
            grid: { display: this.options.showGridLines },
            ticks: { display: this.options.showAxisLabels },
          },
        };
      }
  
      return chartOptions;
    }
  
    private build(): Chart {
      const config: ChartConfiguration = {
        type: this.toInternalType(this.options.type),
        data: { labels: this.options.labels, datasets: this.buildDatasets() } as ChartData,
        options: this.buildOptions(),
      };
  
      return new Chart(this.canvas, config);
    }
  
    /** Replace data/labels in place without recreating the canvas. */
    update(labels: string[], datasets: ChartDatasetInput[]): void {
      this.options.labels = labels;
      this.options.datasets = datasets;
      this.chart.data.labels = labels;
      this.chart.data.datasets = this.buildDatasets();
      this.chart.update();
    }
  
    resize(): void {
      this.chart.resize();
    }
  
    destroy(): void {
      this.chart.destroy();
      this.wrapper.remove();
    }
  }