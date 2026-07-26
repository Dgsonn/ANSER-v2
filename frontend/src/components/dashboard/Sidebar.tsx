import Link from "next/link";
import {
  BoltIcon,
  BoxIcon,
  ChartIcon,
  FactoryIcon,
  HomeIcon,
  WarehouseIcon,
} from "@/components/dashboard/icons";

const navItems = [
  { label: "Trang chủ", icon: HomeIcon, href: "/dashboard", active: true },
  { label: "Sản phẩm", icon: BoxIcon },
  { label: "Quản lý kho", icon: WarehouseIcon },
  { label: "Sản xuất", icon: FactoryIcon },
  { label: "Báo cáo", icon: ChartIcon },
  { label: "Tự động hoá", icon: BoltIcon },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.02] p-4 sm:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight">
        <span className="bg-gradient-to-br from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          ▲
        </span>
        ANSER
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </>
          );
          return item.active ? (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-sky-500/10 px-3 py-2.5 text-sm font-semibold text-white"
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500"
              title="Sắp ra mắt"
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
        <p className="text-xs font-semibold text-zinc-300">ANSER Engine v2.0</p>
        <p className="mt-1 text-[11px] text-zinc-500">Bản demo — dữ liệu mẫu</p>
      </div>
    </aside>
  );
}
