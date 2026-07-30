import { NextResponse } from "next/server";
import { createTransaction, InsufficientStockError, listTransactions, TransactionType } from "@/server/store/inventory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as TransactionType | null;
  const limitParam = searchParams.get("limit");
  const warehouseIdsParam = searchParams.get("warehouseIds");
  const warehouseIds = warehouseIdsParam ? warehouseIdsParam.split(",").filter(Boolean) : undefined;

  const transactions = await listTransactions({
    type: type === "import" || type === "export" ? type : undefined,
    limit: limitParam ? Number(limitParam) : undefined,
    warehouseIds,
  });
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const { productId, type, quantity, counterparty, note } = await request.json().catch(() => ({}));

  if (!productId || (type !== "import" && type !== "export")) {
    return NextResponse.json({ message: "Thiếu sản phẩm hoặc loại phiếu không hợp lệ." }, { status: 400 });
  }
  const quantityNum = Number(quantity);
  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    return NextResponse.json({ message: "Số lượng phải lớn hơn 0." }, { status: 400 });
  }

  try {
    const transaction = await createTransaction({
      productId,
      type,
      quantity: quantityNum,
      counterparty,
      note,
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: "Không tìm thấy sản phẩm." }, { status: 404 });
  }
}
