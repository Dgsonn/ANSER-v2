"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { EditIcon, PlusIcon, TrashIcon, XIcon } from "@/components/dashboard/icons";
import type { Product } from "@/server/store/products";
import type { Warehouse } from "@/server/store/warehouses";

const CATEGORIES = ["Nguyên vật liệu", "Bán thành phẩm", "Thành phẩm", "Phụ liệu"];

const statusStyles: Record<string, string> = {
  "Còn hàng": "bg-emerald-500/15 text-emerald-400",
  "Sắp hết": "bg-amber-500/15 text-amber-400",
  "Hết hàng": "bg-red-500/15 text-red-400",
};

function productStatus(stock: number) {
  if (stock <= 0) return "Hết hàng";
  if (stock < 20) return "Sắp hết";
  return "Còn hàng";
}

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

type FormState = { name: string; category: string; unit: string; stock: string; price: string; warehouseId: string };

export default function ProductsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    category: CATEGORIES[0],
    unit: "",
    stock: "0",
    price: "0",
    warehouseId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/warehouses");
      const data = await res.json();
      setWarehouses(data.warehouses ?? []);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, [search, category]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  function warehouseName(id: string) {
    return warehouses.find((w) => w.id === id)?.name ?? "—";
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      name: "",
      category: CATEGORIES[0],
      unit: "",
      stock: "0",
      price: "0",
      warehouseId: warehouses[0]?.id ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      stock: String(product.stock),
      price: String(product.price),
      warehouseId: product.warehouseId,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      stock: Number(form.stock),
      price: Number(form.price),
      warehouseId: form.warehouseId,
    };

    const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Có lỗi xảy ra.");
      return;
    }

    setModalOpen(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá sản phẩm này? Hành động không thể hoàn tác.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="mt-1 text-sm text-zinc-400">Quản lý danh mục sản phẩm và tồn kho hiện tại.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
          className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
        >
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs text-zinc-500 uppercase">
                <th className="px-5 py-3 font-medium">Mã SP</th>
                <th className="px-5 py-3 font-medium">Tên sản phẩm</th>
                <th className="px-5 py-3 font-medium">Kho</th>
                <th className="px-5 py-3 font-medium">Danh mục</th>
                <th className="px-5 py-3 font-medium">Tồn kho</th>
                <th className="px-5 py-3 font-medium">Giá bán</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    Chưa có sản phẩm nào.
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const status = productStatus(p.stock);
                return (
                  <tr key={p.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{p.code}</td>
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-zinc-400">{warehouseName(p.warehouseId)}</td>
                    <td className="px-5 py-3 text-zinc-400">{p.category}</td>
                    <td className="px-5 py-3 text-zinc-400">
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{formatVnd(p.price)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                          title="Sửa"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Xoá"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-950 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:text-white">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Tên sản phẩm</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Kho</label>
                  <select
                    required
                    value={form.warehouseId}
                    onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Đơn vị đóng gói</label>
                  <input
                    required
                    placeholder="VD: Chai 1L, Thùng 20L, Phuy 200L..."
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Tồn kho</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Giá bán (₫)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
