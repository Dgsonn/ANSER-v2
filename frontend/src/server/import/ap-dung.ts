// Đối chiếu dòng đã đọc với dữ liệu đang có, rồi ghi — khi người đã xác nhận.
//
// HAI BƯỚC, KHÔNG PHẢI MỘT. `lapKeHoach` chỉ ĐỌC và trả về "sẽ thêm bao nhiêu,
// sẽ sửa bao nhiêu, sửa những gì". `apDung` mới ghi. Tách ra vì bước ở giữa là
// một con người nhìn vào bảng rồi bấm Xác nhận — giống hệt MISA/KiotViet. Một
// hàm vừa đối chiếu vừa ghi thì không chèn được người vào giữa, và một file cũ
// tải nhầm sẽ đè giá bán với tồn kho hiện tại mà không ai kịp thấy.

import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/server/db/client";
import { customers, products, suppliers } from "@/server/db/schema";
import { getOrCreateCategoryByName } from "@/server/store/categories";
import type { DongDoc, KetQuaDoc, LoaiFile } from "./doc-excel";

/** Một trường sẽ đổi khi cập nhật — để bảng xem trước nói rõ đổi cái gì. */
export type ThayDoi = { truong: string; cu: unknown; moi: unknown };

export type MucKeHoach = {
  dong: DongDoc;
  /** Chỉ có khi `capNhat` — id bản ghi đang có. */
  idHienTai?: string;
  thayDoi?: ThayDoi[];
};

export type KeHoach = {
  loai: LoaiFile;
  themMoi: MucKeHoach[];
  capNhat: MucKeHoach[];
  /** Cập nhật mà KHÔNG có gì đổi — tách riêng để con số "sẽ sửa" nói đúng sự thật. */
  khongDoi: MucKeHoach[];
  loi: DongDoc[];
  boQua: DongDoc[];
  canhBao: string[];
};

function so(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
  return String(a) === String(b);
}

function themNeuKhac(ra: ThayDoi[], truong: string, cu: unknown, moi: unknown) {
  // `undefined` = file không nhắc tới trường này -> GIỮ NGUYÊN, không phải xoá.
  // Nhập một bản xuất thiếu cột không được biến thành lệnh xoá dữ liệu đang có.
  if (moi === undefined) return;
  if (!so(cu, moi)) ra.push({ truong, cu, moi });
}

// --------------------------------------------------------------------------
// Lập kế hoạch (CHỈ ĐỌC)
// --------------------------------------------------------------------------

export async function lapKeHoach(kq: KetQuaDoc): Promise<KeHoach> {
  const kh: KeHoach = {
    loai: kq.loai, themMoi: [], capNhat: [], khongDoi: [],
    loi: [], boQua: [], canhBao: [...kq.canhBao],
  };

  for (const d of kq.dong) {
    if (d.boQua) kh.boQua.push(d);
    else if (d.loi.length) kh.loi.push(d);
  }
  const nhap = kq.dong.filter((d) => !d.boQua && d.loi.length === 0);
  if (!nhap.length) return kh;

  // Tải TOÀN BỘ mã đang có rồi so trong bộ nhớ, thay vì một truy vấn IN(...)
  // dài 161 phần tử. Ba bảng này đếm bằng trăm dòng — bản xuất thật: 161 hàng
  // hoá, 105 khách, 43 nhà cung cấp. Đơn giản hơn, và so được KHÔNG PHÂN BIỆT
  // HOA THƯỜNG y như unique index `lower(code)` bên dưới, nên hai nơi không
  // thể lệch nhau về việc "thế nào là trùng".
  const map = new Map<string, Record<string, unknown>>();
  if (kq.loai === "hang_hoa") {
    const rows = await db.select({
      id: products.id, code: products.code, name: products.name,
      unit: products.unit, stock: products.stock, cost: products.cost,
      categoryId: products.categoryId, isReducedVat: products.isReducedVat,
    }).from(products);
    rows.forEach((r) => map.set(r.code.toLowerCase(), r));
  } else {
    const bang = kq.loai === "khach_hang" ? customers : suppliers;
    const rows = await db.select({
      id: bang.id, code: bang.code, name: bang.name, address: bang.address,
      taxCode: bang.taxCode, phone: bang.phone, openingDebt: bang.openingDebt,
    }).from(bang).where(isNotNull(bang.code));
    rows.forEach((r) => { if (r.code) map.set(r.code.toLowerCase(), r); });
  }

  for (const d of nhap) {
    const ht = map.get(d.code.toLowerCase());
    if (!ht) { kh.themMoi.push({ dong: d }); continue; }

    const td: ThayDoi[] = [];
    themNeuKhac(td, "Tên", ht.name, d.name);
    if (kq.loai === "hang_hoa") {
      themNeuKhac(td, "Đơn vị tính", ht.unit, d.unit);
      themNeuKhac(td, "Tồn kho", ht.stock, d.stock);
      themNeuKhac(td, "Giá vốn", ht.cost, d.cost);
      themNeuKhac(td, "Giảm 2% VAT", ht.isReducedVat, d.isReducedVat);
    } else {
      themNeuKhac(td, "Địa chỉ", ht.address, d.address);
      themNeuKhac(td, "Mã số thuế", ht.taxCode, d.taxCode);
      themNeuKhac(td, "Điện thoại", ht.phone, d.phone);
      themNeuKhac(td, "Công nợ", ht.openingDebt, d.openingDebt);
    }
    const muc: MucKeHoach = { dong: d, idHienTai: ht.id as string, thayDoi: td };
    (td.length ? kh.capNhat : kh.khongDoi).push(muc);
  }
  return kh;
}

// --------------------------------------------------------------------------
// Ghi (chỉ gọi sau khi người xác nhận)
// --------------------------------------------------------------------------

export type KetQuaGhi = { them: number; sua: number; boQua: number; loi: string[] };

export async function apDung(
  kq: KetQuaDoc, warehouseId?: string,
): Promise<KetQuaGhi> {
  const kh = await lapKeHoach(kq);
  const ra: KetQuaGhi = { them: 0, sua: 0, boQua: kh.boQua.length + kh.khongDoi.length, loi: [] };

  if (kq.loai === "hang_hoa" && !warehouseId) {
    throw new Error(
      "Chưa chọn kho. Bản xuất `Danh sách hàng hoá, dịch vụ` của MISA không có " +
      "cột kho nào, mà `products.warehouse_id` là bắt buộc — nên kho phải do " +
      "người chọn, không đoán được.",
    );
  }

  // Danh mục tạo TRƯỚC giao dịch: `getOrCreateCategoryByName` tự mở giao dịch
  // riêng, lồng nó vào trong đây là giữ khoá lâu vô ích. Số nhóm rất ít (bản
  // xuất thật: 3 nhóm cho 161 mặt hàng) nên vòng này gần như không tốn gì.
  const idNhom = new Map<string, string>();
  if (kq.loai === "hang_hoa") {
    for (const ten of new Set(
      [...kh.themMoi, ...kh.capNhat].map((m) => m.dong.category).filter(Boolean) as string[],
    )) {
      idNhom.set(ten, (await getOrCreateCategoryByName(ten)).id);
    }
  }

  // MỘT giao dịch cho cả lượt nhập. Nửa chừng gãy mà đã ghi được 80 dòng là
  // trạng thái tệ nhất: người dùng không biết nhập lại có an toàn không.
  await db.transaction(async (tx) => {
    if (kq.loai === "hang_hoa") {
      for (const m of kh.themMoi) {
        const d = m.dong;
        await tx.insert(products).values({
          code: d.code, name: d.name, warehouseId: warehouseId!,
          categoryId: d.category ? idNhom.get(d.category) ?? null : null,
          unit: d.unit || "Cái", stock: d.stock ?? 0,
          cost: d.cost ?? null, isReducedVat: d.isReducedVat ?? null,
        });
        ra.them++;
      }
      for (const m of kh.capNhat) {
        const d = m.dong;
        await tx.update(products).set({
          name: d.name, unit: d.unit || "Cái", stock: d.stock ?? 0,
          cost: d.cost ?? null, isReducedVat: d.isReducedVat ?? null,
          ...(d.category ? { categoryId: idNhom.get(d.category) ?? null } : {}),
          updatedAt: new Date(),
        }).where(eq(products.id, m.idHienTai!));
        ra.sua++;
      }
    } else {
      const bang = kq.loai === "khach_hang" ? customers : suppliers;
      for (const m of kh.themMoi) {
        const d = m.dong;
        await tx.insert(bang).values({
          code: d.code, name: d.name, address: d.address ?? null,
          taxCode: d.taxCode ?? null, phone: d.phone ?? null,
          openingDebt: d.openingDebt ?? null,
        });
        ra.them++;
      }
      for (const m of kh.capNhat) {
        const d = m.dong;
        await tx.update(bang).set({
          name: d.name, address: d.address ?? null, taxCode: d.taxCode ?? null,
          phone: d.phone ?? null, openingDebt: d.openingDebt ?? null,
        }).where(and(eq(bang.id, m.idHienTai!)));
        ra.sua++;
      }
    }
  });

  ra.loi = kh.loi.map((d) => `dòng ${d.dongExcel}: ${d.loi.join(", ")}`);
  return ra;
}
