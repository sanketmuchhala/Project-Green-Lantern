import { Line, Bar, Doughnut, Scatter } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Title } from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Title);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
  scales: {
    x: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#a0a0a0", font: { size: 10 } } },
    y: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#a0a0a0", font: { size: 10 } } },
  },
};

const colors = {
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#f59e0b',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  pink: '#ec4899',
  fuchsia: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  indigo: '#6366f1',
};

const colorPalette = Object.values(colors);

export function LineChart({ labels, series }: { labels: string[]; series: { label: string; data: number[] }[] }) {
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      ...s,
      borderColor: colorPalette[i % colorPalette.length],
      backgroundColor: colorPalette[i % colorPalette.length] + '33',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
    })),
  };
  return <div className="h-64"><Line data={data} options={baseOptions} /></div>;
}

export function BarStack({ labels, stacks }: { labels: string[]; stacks: { label: string; data: number[] }[] }) {
  const data = {
    labels,
    datasets: stacks.map((s, i) => ({
      ...s,
      backgroundColor: colorPalette[i % colorPalette.length],
    })),
  };
  const options = { ...baseOptions, scales: { ...baseOptions.scales, x: { ...baseOptions.scales.x, stacked: true }, y: { ...baseOptions.scales.y, stacked: true } } };
  return <div className="h-64"><Bar data={data} options={options} /></div>;
}

export function DoughnutChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => colorPalette[i % colorPalette.length]),
      borderWidth: 0,
    }],
  };
  const options = { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom' as const, labels: { color: '#a0a0a0' } } } };
  return <div className="h-64"><Doughnut data={data} options={options} /></div>;
}

export function ScatterChart({ points, seriesKey }: { points: any[]; seriesKey: string }) {
  const seriesNames = Array.from(new Set(points.map(p => p[seriesKey])));
  const data = {
    datasets: seriesNames.map((name, i) => ({
      label: name as string,
      data: points.filter(p => p[seriesKey] === name).map(p => ({ x: p.x, y: p.y, r: p.r, label: p.label })),
      backgroundColor: colorPalette[i % colorPalette.length],
    })),
  };
  const options = { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom' as const, labels: { color: '#a0a0a0' } } } };
  return <div className="h-64"><Scatter data={data} options={options} /></div>;
}

export function Gauge({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const color = percentage > 80 ? colors.red : percentage > 50 ? colors.amber : colors.green;
  return (
    <div className="flex flex-col items-center justify-center p-2 bg-neutral-900 rounded-lg">
      <div className="text-3xl font-bold text-white">{value.toFixed(0)}<span className="text-lg text-neutral-400">{unit}</span></div>
      <div className="text-sm text-neutral-400 mt-1">{label}</div>
      <div className="w-full bg-neutral-700 rounded-full h-2 mt-2">
        <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}