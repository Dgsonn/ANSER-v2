import { NextResponse } from "next/server";
import { createProduct, listProducts, PRODUCT_CATEGORIES } from "@/server/store/products";
import { listWarehouses } from "@/server/store/warehouses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  // Chỉ lọc theo kho khi có truyền `warehouseIds` (trang Quản lý kho) — mặc định
  // trả về sản phẩm của mọi kho, vì lọc theo kho là tính năng riêng của trang đó.
  const warehouseIdsParam = searchParams.get("warehouseIds");
  const warehouseIds = warehouseIdsParam ? warehouseIdsParam.split(",").filter(Boolean) : undefined;

  const products = await listProducts({ search, category, warehouseIds });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const { name, category, unit, stock, price, warehouseId } = await request.json().catch(() => ({}));

  if (!name || !category || !unit || !warehouseId) {
    return NextResponse.json({ message: "Thiếu tên, danh mục, đơn vị hoặc kho của sản phẩm." }, { status: 400 });
  }
  if (!PRODUCT_CATEGORIES.includes(category)) {
    return NextResponse.json({ message: "Danh mục không hợp lệ." }, { status: 400 });
  }
  const validWarehouses = await listWarehouses();
  if (!validWarehouses.some((w) => w.id === warehouseId)) {
    return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
  }
  const stockNum = Number(stock);
  const priceNum = Number(price);
  if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isFinite(priceNum) || priceNum < 0) {
    return NextResponse.json({ message: "Tồn kho/giá bán không hợp lệ." }, { status: 400 });
  }

  const product = await createProduct({ name, category, unit, stock: stockNum, price: priceNum, warehouseId });
  return NextResponse.json({ product }, { status: 201 });
}
