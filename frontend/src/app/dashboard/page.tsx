import BarChartCard from "@/components/dashboard/BarChartCard";
import StatCard from "@/components/dashboard/StatCard";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIcon,
  PlusIcon,
  TruckIcon,
} from "@/components/dashboard/icons";

const weeklyFlow = [
  { label: "T2", a: 120, b: 90 },
  { label: "T3", a: 150, b: 110 },
  { label: "T4", a: 90, b: 130 },
  { label: "T5", a: 180, b: 100 },
  { label: "T6", a: 140, b: 160 },
  { label: "T7", a: 70, b: 60 },
  { label: "CN", a: 40, b: 30 },
];

const monthlyRevenue = [
  { label: "Th1", a: 320, b: 410 },
  { label: "Th2", a: 280, b: 390 },
  { label: "Th3", a: 350, b: 460 },
  { label: "Th4", a: 300, b: 420 },
  { label: "Th5", a: 380, b: 500 },
  { label: "Th6", a: 340, b: 470 },
];

const stockByCategory = [
  { label: "Nguyên vật liệu", pct: 78 },
  { label: "Bán thành phẩm", pct: 52 },
  { label: "Thành phẩm", pct: 65 },
  { label: "Phụ liệu", pct: 34 },
];

const recentImports = [
  { supplier: "Cty TNHH Vật Liệu An Phát", amount: "45,000,000₫", date: "24/07/2026", status: "Hoàn tất" },
  { supplier: "Nhà cung cấp Thép Miền Nam", amount: "128,500,000₫", date: "23/07/2026", status: "Hoàn tất" },
  { supplier: "Cty CP Bao Bì Việt", amount: "12,300,000₫", date: "22/07/2026", status: "Đang xử lý" },
  { supplier: "Kho phụ liệu Hưng Thịnh", amount: "8,750,000₫", date: "21/07/2026", status: "Hoàn tất" },
];

const products = [
  { code: "SP-001", name: "Trục cán inox 304", category: "Thành phẩm", stock: 320, price: "1,250,000₫", status: "Còn hàng" },
  { code: "SP-014", name: "Vòng bi công nghiệp", category: "Bán thành phẩm", stock: 15, price: "480,000₫", status: "Sắp hết" },
  { code: "SP-027", name: "Tấm nhôm 5mm", category: "Nguyên vật liệu", stock: 0, price: "620,000₫", status: "Hết hàng" },
  { code: "SP-033", name: "Bulong M10 (hộp 100)", category: "Phụ liệu", stock: 540, price: "95,000₫", status: "Còn hàng" },
  { code: "SP-041", name: "Motor giảm tốc 1HP", category: "Thành phẩm", stock: 42, price: "3,150,000₫", status: "Còn hàng" },
];

const notifications = [
  { title: "Lệnh sản xuất SX-0231 hoàn tất", subtitle: "Dây chuyền A - 500 sản phẩm", time: "10 phút trước" },
  { title: "NVL tấm nhôm 5mm sắp hết", subtitle: "Tồn kho còn 0 đơn vị", time: "1 giờ trước" },
  { title: "Đơn nhập kho mới từ Thép Miền Nam", subtitle: "128,500,000₫ - 23/07/2026", time: "3 giờ trước" },
];

const statusStyles: Record<string, string> = {
  "Còn hàng": "bg-emerald-500/15 text-emerald-400",
  "Sắp hết": "bg-amber-500/15 text-amber-400",
  "Hết hàng": "bg-red-500/15 text-red-400",
  "Hoàn tất": "bg-emerald-500/15 text-emerald-400",
  "Đang xử lý": "bg-sky-500/15 text-sky-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] ?? "bg-white/10 text-zinc-300"}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/10 to-sky-500/5 p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Xin chào, Sơn 👋</h1>
          <p className="mt-1 text-sm text-zinc-400">Chủ Nhật, 27 Tháng 7, 2026 · Tổng quan vận hành sản xuất</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5">
            <PlusIcon className="h-4 w-4" />
            Thêm sản phẩm
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.09]">
            <PlusIcon className="h-4 w-4" />
            Tạo lệnh sản xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng sản phẩm" value="248" accent="sky" icon={BoxIcon} note="+12 sản phẩm mới tháng này" />
        <StatCard label="Nhập kho tháng này" value="1,320" accent="emerald" icon={ArrowDownIcon} note="Tăng 8% so với tháng trước" />
        <StatCard label="Xuất kho tháng này" value="980" accent="violet" icon={ArrowUpIcon} note="Tăng 3% so với tháng trước" />
        <StatCard label="Cảnh báo tồn kho" value="3" accent="red" icon={AlertTriangleIcon} note="Sản phẩm sắp/đã hết hàng" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard title="Nhập / Xuất kho 7 ngày qua" data={weeklyFlow} legendA="Nhập" legendB="Xuất" colorA="bg-sky-500" colorB="bg-violet-600" />
        <BarChartCard title="Doanh thu theo tháng (triệu VNĐ)" data={monthlyRevenue} legendA="Chi phí" legendB="Doanh thu" colorA="bg-zinc-500" colorB="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h3 className="mb-5 text-sm font-semibold text-zinc-200">Tồn kho theo danh mục</h3>
          <div className="flex flex-col gap-4">
            {stockByCategory.map((c) => (
              <div key={c.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-zinc-300">{c.label}</span>
                  <span className="text-zinc-500">{c.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-sky-500"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Nhập kho gần đây</h3>
          <div className="flex flex-col gap-3">
            {recentImports.map((r) => (
              <div key={r.supplier} className="flex items-center gap-3 rounded-xl bg-black/30 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                  <TruckIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.supplier}</p>
                  <p className="text-xs text-zinc-500">
                    {r.amount} · {r.date}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] lg:col-span-2">
          <div className="border-b border-white/[0.08] p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Sản phẩm tồn kho</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-zinc-500 uppercase">
                  <th className="px-5 py-3 font-medium">Mã SP</th>
                  <th className="px-5 py-3 font-medium">Tên sản phẩm</th>
                  <th className="px-5 py-3 font-medium">Danh mục</th>
                  <th className="px-5 py-3 font-medium">Tồn kho</th>
                  <th className="px-5 py-3 font-medium">Giá bán</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.code} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{p.code}</td>
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{p.category}</td>
                    <td className="px-5 py-3 text-zinc-400">{p.stock}</td>
                    <td className="px-5 py-3 text-zinc-400">{p.price}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Thông báo</h3>
          <div className="flex flex-col gap-4">
            {notifications.map((n) => (
              <div key={n.title} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-zinc-500">{n.subtitle}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
