import { ComponentType, SVGProps } from "react";

const accentStyles = {
  sky: "bg-sky-500/15 text-sky-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  red: "bg-red-500/15 text-red-400",
} as const;

type StatCardProps = {
  label: string;
  value: string;
  note?: string;
  accent: keyof typeof accentStyles;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function StatCard({ label, value, note, accent, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentStyles[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {note && <p className="mt-3 text-xs text-zinc-500">{note}</p>}
    </div>
  );
}
