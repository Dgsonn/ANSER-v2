type DataPoint = { label: string; a: number; b: number };

type BarChartCardProps = {
  title: string;
  data: DataPoint[];
  legendA: string;
  legendB: string;
  colorA?: string;
  colorB?: string;
};

export default function BarChartCard({
  title,
  data,
  legendA,
  legendB,
  colorA = "bg-sky-500",
  colorB = "bg-violet-600",
}: BarChartCardProps) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${colorA}`} />
            {legendA}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${colorB}`} />
            {legendB}
          </span>
        </div>
      </div>

      <div className="flex h-40 items-end justify-between gap-2 border-b border-white/[0.08] pb-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 items-end justify-center gap-1">
            <div
              className={`w-full rounded-t-md ${colorA}`}
              style={{ height: `${(d.a / max) * 100}%` }}
              title={`${legendA}: ${d.a}`}
            />
            <div
              className={`w-full rounded-t-md ${colorB}`}
              style={{ height: `${(d.b / max) * 100}%` }}
              title={`${legendB}: ${d.b}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
