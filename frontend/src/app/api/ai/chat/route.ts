import { NextResponse } from "next/server";
import { askBrain, brainErrorToHttp } from "@/server/brain";
import { getSessionUser } from "@/server/session";
import { listWarehouses } from "@/server/store/warehouses";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { message?: unknown; warehouseId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body phải là JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Thiếu nội dung tin nhắn" }, { status: 400 });
  }
  // Chặn ngay ở cửa thay vì để Brain nuốt một prompt khổng lồ rồi mới hết giờ.
  if (message.length > 4000) {
    return NextResponse.json({ error: "Tin nhắn quá dài (tối đa 4000 ký tự)" }, { status: 400 });
  }

  // `warehouseId` từ client CHỈ là gợi ý — phải đối chiếu với kho có thật.
  // Nhận thẳng giá trị client gửi là mở đường cho việc hỏi dữ liệu kho khác.
  const warehouses = await listWarehouses();
  if (warehouses.length === 0) {
    return NextResponse.json({ error: "Chưa có kho nào" }, { status: 409 });
  }
  const requested = typeof body.warehouseId === "string" ? body.warehouseId : null;
  const warehouse = warehouses.find((w) => w.id === requested) ?? warehouses[0];

  try {
    const answer = await askBrain(message, { userId: user.id, warehouseId: warehouse.id });
    return NextResponse.json({
      reply: answer.answer,
      sources: answer.sources ?? null,
      confidence: answer.confidence ?? null,
      warehouseId: warehouse.id,
      taskId: answer.taskId,
    });
  } catch (error) {
    const { status, body: errorBody, headers } = brainErrorToHttp(error);
    return NextResponse.json(errorBody, { status, headers });
  }
}
