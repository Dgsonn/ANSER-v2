import { BellIcon, ChevronDownIcon, SearchIcon } from "@/components/dashboard/icons";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#030305]/70 px-6 py-4 backdrop-blur-xl">
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-sky-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button type="button" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-sky-500 text-sm font-bold">
            S
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold">Sơn Dương</p>
            <p className="text-xs text-zinc-500">Quản trị viên</p>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
    </header>
  );
}
