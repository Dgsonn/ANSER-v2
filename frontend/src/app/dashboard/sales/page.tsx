"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PlusIcon, TrashIcon, TruckIcon } from "@/components/dashboard/icons";
import type { CustomerWithStats } from "@/server/store/customers";
import type { Product } from "@/server/store/products";
import type { SalesInvoice } from "@/server/store/sales";
import type { Warehouse } from "@/server/store/warehouses";

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

type ItemRow = { productId: string; quantity: string };

export default function SalesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [productsRes, invoicesRes, customersRes, warehousesRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/sales/invoices?limit=10"),
      fetch("/api/customers"),
      fetch("/api/warehouses"),
    ]);
    const productsData = await productsRes.json();
    const invoicesData = await invoicesRes.json();
    const customersData = await customersRes.json();
    const warehousesData = await warehousesRes.json();
    const nextProducts: Product[] = productsData.products ?? [];
    setProducts(nextProducts);
    setInvoices(invoicesData.invoices ?? []);
    setCustomers(customersData.customers ?? []);
    setWarehouses(warehousesData.warehouses ?? []);
    setItems((rows) =>
      rows.map((row) =>
        nextProducts.some((p) => p.id === row.productId) ? row : { ...row, productId: nextProducts[0]?.id ?? "" },
      ),
    );
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  function priceOf(productId: string) {
    return products.find((p) => p.id === productId)?.price ?? 0;
  }

  function warehouseName(productId: string) {
    const product = products.find((p) => p.id === productId);
    return warehouses.find((w) => w.id === product?.warehouseId)?.name;
  }

  const total = items.reduce((sum, row) => sum + priceOf(row.productId) * (Number(row.quantity) || 0), 0);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((rows) => [...rows, { productId: products[0]?.id ?? "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/sales/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || undefined,
        customerName: customerId ? undefined : customerName,
        note: note || undefined,
        items: items
          .filter((row) => row.productId && Number(row.quantity) > 0)
          .map((row) => ({ productId: row.productId, quantity: Number(row.quantity) })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Có lỗi xảy ra.");
      return;
    }

    setCustomerId("");
    setCustomerName("");
    setNote("");
    setItems([{ productId: products[0]?.id ?? "", quantity: "1" }]);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Bán hàng</h1>
        <p className="mt-1 text-sm text-zinc-400">Tạo hoá đơn bán hàng — tự động trừ tồn kho và ghi nhận doanh thu.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">Tạo hoá đơn</h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Khách hàng</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">— Khách vãng lai (nhập tên) —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {!customerId && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Tên khách vãng lai</label>
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Ghi chú (tuỳ chọn)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Sản phẩm</label>
              {items.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    required
                    value={row.productId}
                    onChange={(e) => updateItem(i, { productId: e.target.value })}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name} · {warehouseName(p.id) ?? "?"} ({formatVnd(p.price)}, tồn: {p.stock}{" "}
                        {p.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateItem(i, { quantity: e.target.value })}
                    className="w-24 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/10"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Thêm dòng
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="text-sm text-zinc-400">Tổng cộng</span>
              <span className="text-lg font-bold text-emerald-400">{formatVnd(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || (!customerId && !customerName) || products.length === 0}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Tạo hoá đơn"}
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="border-b border-white/[0.08] p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Hoá đơn gần đây</h3>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {invoices.length === 0 && <p className="text-sm text-zinc-500">Chưa có hoá đơn nào.</p>}
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl bg-black/30 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <TruckIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{inv.customerName}</p>
                  <p className="text-xs text-zinc-500">{new Date(inv.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">{formatVnd(inv.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
