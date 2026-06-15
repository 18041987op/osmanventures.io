"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export function DonutChart({ labels, data, colors, onSlice }:{
  labels: string[]; data: number[]; colors: string[]; onSlice?: (i: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    inst.current = new Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
      options: {
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: { legend: { position: "bottom", labels: { font: { size: 13 }, padding: 12, boxWidth: 14 } } },
        onClick: (_e, els) => { if (els.length && onSlice) onSlice(els[0].index); },
      },
    });
    return () => inst.current?.destroy();
  }, [labels, data, colors, onSlice]);
  return <canvas ref={ref} />;
}

export function BarChart({ labels, data, color }:{ labels: string[]; data: number[]; color: string; }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    inst.current = new Chart(ref.current, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 6 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { ticks: { font: { size: 12 } }, grid: { display: false } }, y: { ticks: { font: { size: 12 } } } } },
    });
    return () => inst.current?.destroy();
  }, [labels, data, color]);
  return <canvas ref={ref} />;
}
