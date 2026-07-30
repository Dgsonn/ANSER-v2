"use client";

import { useCallback, useEffect, useState } from "react";

type CompanySettings = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxCode: string | null;
  currency: string;
};

const emptyForm: CompanySettings = { name: "", address: "", phone: "", email: "", taxCode: "", currency: "VND" };

export default function SettingsPage() {
  const [form, setForm] = useState<CompanySettings>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings/company");
    const data = await res.json();
    const s = data.settings;
    setForm({
      name: s.name ?? "",
      address: s.address ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      taxCode: s.taxCode ?? "",
      currency: s.currency ?? "VND",
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/settings/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Có lỗi xảy ra.");
      return;
    }

    showToast("Đã lưu thông tin doanh nghiệp.");
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        Trang chủ <span className="mx-1.5">›</span> <span className="text-zinc-300">Cài đặt</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="mt-1 text-sm text-zinc-500">Thông tin doanh nghiệp hiển thị trên hoá đơn và báo cáo.</p>
      </div>

      <div className="max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">Thông tin doanh nghiệp</h3>

        {loading ? (
          <p className="text-sm text-zinc-500">Đang tải...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Tên doanh nghiệp</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Công ty TNHH ANSER"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Địa chỉ</label>
              <input
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Số điện thoại</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Email</label>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Mã số thuế</label>
                <input
                  value={form.taxCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Đơn vị tiền tệ</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-xs rounded-xl border border-white/[0.08] bg-zinc-900 px-4 py-3 text-sm text-zinc-200 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
