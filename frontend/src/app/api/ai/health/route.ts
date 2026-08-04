import { NextResponse } from "next/server";
import { checkBrainHealth, isBrainConfigured } from "@/server/brain";
import { getSessionUser } from "@/server/session";

// Luôn trả 200 kèm trạng thái, KHÔNG trả lỗi HTTP khi Brain chết.
// Đây là endpoint để UI hiển thị "AI đang bật/tắt" — bản thân nó không được là
// chỗ hỏng. Brain chết vẫn phải trả lời được rằng Brain đang chết.
export async function GET() {
  // Ba route AI kia đều chặn khách vãng lai, riêng route này thì quên — phát
  // hiện lúc chạy thật (03/08/2026). Bỏ trống không phải chuyện nhỏ: nó phơi
  // ra địa chỉ nội bộ của Brain trong thông báo lỗi, phơi thống kê hàng đợi,
  // và biến mỗi lượt gọi ẩn danh thành một lượt gọi sang Brain — tức là ai
  // cũng nện được Brain qua Body mà không cần tài khoản.
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  if (!isBrainConfigured()) {
    return NextResponse.json({
      configured: false,
      ok: false,
      detail: "Chưa đặt BRAIN_URL trong .env.local — tính năng AI đang tắt.",
    });
  }

  const result = await checkBrainHealth();
  if (!result.ok) {
    return NextResponse.json({ configured: true, ok: false, kind: result.kind, detail: result.message });
  }

  const { health } = result;
  return NextResponse.json({
    configured: true,
    ok: true,
    degraded: health.degraded,
    engine_ready: health.engine_ready,
    vision_ready: health.vision_ready,
    // Thống kê hàng đợi của Brain — nhìn được `peak_queued` / `rejected_total`
    // mới chỉnh được ngưỡng đồng thời, không thì chỉ là đoán.
    load: health.load ?? null,
  });
}
