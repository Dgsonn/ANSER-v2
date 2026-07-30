import { NextResponse } from "next/server";
import { deleteProduct, getProductById, PRODUCT_CATEGORIES, updateProduct } from "@/server/store/products";
import { listWarehouses } from "@/server/store/warehouses";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.category && !PRODUCT_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ message: "Danh mục không hợp lệ." }, { status: 400 });
  }

  if (body.warehouseId !== undefined) {
    const validWarehouses = await listWarehouses();
    if (!validWarehouses.some((w) => w.id === body.warehouseId)) {
      return NextResponse.json({ message: "Kho không hợp lệ." }, { status: 400 });
    }
  }

  const patch: Partial<{
    name: string;
    category: string;
    unit: string;
    stock: number;
    price: number;
    warehouseId: string;
  }> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) patch.category = body.category;
  if (body.unit !== undefined) patch.unit = body.unit;
  if (body.warehouseId !== undefined) patch.warehouseId = body.warehouseId;
  if (body.stock !== undefined) {
    const stockNum = Number(body.stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      return NextResponse.json({ message: "Tồn kho không hợp lệ." }, { status: 400 });
    }
    patch.stock = stockNum;
  }
  if (body.price !== undefined) {
    const priceNum = Number(body.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json({ message: "Giá bán không hợp lệ." }, { status: 400 });
    }
    patch.price = priceNum;
  }

  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const product = await updateProduct(id, patch);
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404 });
  }
  await deleteProduct(id);
  return new NextResponse(null, { status: 204 });
}
