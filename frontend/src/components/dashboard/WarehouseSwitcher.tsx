"use client";

import { useState } from "react";
import { ChevronDownIcon, PlusIcon, WarehouseIcon } from "@/components/dashboard/icons";
import type { Warehouse } from "@/server/store/warehouses";

type WarehouseSwitcherProps = {
  warehouses: Warehouse[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onWarehouseCreated: (warehouse: Warehouse) => void;
  onWarehouseUpdated: (warehouse: Warehouse) => void;
};

export default function WarehouseSwitcher({
  warehouses,
  selectedIds,
  onChange,
  onWarehouseCreated,
  onWarehouseUpdated,
}: WarehouseSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});

  function toggle(id: string) {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    if (next.length === 0) return; // luôn phải chọn ít nhất 1 kho
    onChange(next);
  }

  function emailValue(w: Warehouse) {
    return emailDrafts[w.id] ?? w.notificationEmail ?? "";
  }

  async function saveNotificationEmail(w: Warehouse) {
    const value = emailValue(w);
    if (value === (w.notificationEmail ?? "")) return; // không đổi, khỏi gọi API

    const res = await fetch(`/api/warehouses/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationEmail: value }),
    });
    if (!res.ok) {
      setError("Không lưu được email nhận cảnh báo.");
      return;
    }
    const { warehouse } = await res.json();
    onWarehouseUpdated(warehouse);
  }

  async function handleCreateWarehouse() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Có lỗi xảy ra.");
      return;
    }

    const { warehouse } = await res.json();
    setNewName("");
    onWarehouseCreated(warehouse);
    onChange([...selectedIds, warehouse.id]);
  }

  const label =
    selectedIds.length === warehouses.length
      ? "Tất cả kho"
      : warehouses
          .filter((w) => selectedIds.includes(w.id))
          .map((w) => w.name)
          .join(", ") || "Chọn kho";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.06]"
      >
        <WarehouseIcon className="h-4 w-4 text-sky-400" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-white/[0.08] bg-zinc-950 p-3 shadow-xl">
            {error && <p className="mb-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-400">{error}</p>}
            <div className="flex flex-col gap-2">
              {warehouses.map((w) => (
                <div key={w.id} className="rounded-lg px-2 py-1.5 hover:bg-white/[0.05]">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(w.id)}
                      onChange={() => toggle(w.id)}
                      className="accent-sky-500"
                    />
                    {w.name}
                  </label>
                  <input
                    value={emailValue(w)}
                    onChange={(e) => setEmailDrafts((d) => ({ ...d, [w.id]: e.target.value }))}
                    onBlur={() => saveNotificationEmail(w)}
                    placeholder="Email nhận cảnh báo (tuỳ chọn)"
                    className="mt-1 w-full rounded-md border border-white/[0.08] bg-black/30 px-2 py-1 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 border-t border-white/[0.08] pt-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên kho mới..."
                className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5 text-xs outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleCreateWarehouse}
                disabled={creating || !newName.trim()}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1.5 text-xs font-semibold hover:bg-white/[0.14] disabled:opacity-50"
              >
                <PlusIcon className="h-3 w-3" />
                Thêm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
