import { NextResponse } from "next/server";
import { listWarehouses } from "@/server/store/warehouses";

// Dùng bởi workflow n8n (Cảnh báo tồn kho thấp, Báo cáo doanh số định kỳ) để biết
// gửi email cho địa chỉ nào ứng với từng kho.
export async function GET() {
  const warehouses = await listWarehouses();
  return NextResponse.json({
    warehouses: warehouses.map((w) => ({
      id: w.id,
      name: w.name,
      notification_email: w.notificationEmail,
    })),
  });
}
