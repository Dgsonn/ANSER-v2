import { NextResponse } from "next/server";
import { brainErrorToHttp, importPartnerFile } from "@/server/brain";
import { getSessionUser } from "@/server/session";
import { layFileTaiLen, truongText } from "@/server/uploadGuard";

/**
 * Soi công nợ từ Danh sách khách hàng / nhà cung cấp khách xuất từ MISA.
 *
 * Cùng lý do đi đường FILE như /api/ai/inventory-audit: công nợ thật của khách
 * nằm ở phần mềm kế toán họ dùng hằng ngày, không nằm trong ANSER. Soi trên dữ
 * liệu ANSER lúc này chỉ soi được thứ ANSER tự sinh ra.
 *
 * File KHÔNG lưu lại ở đâu — danh sách công nợ lộ ra toàn bộ khách hàng và số
 * tiền từng người đang nợ, đây là dữ liệu nhạy cảm ngang sổ kho.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kq = await layFileTaiLen(request);
  if (kq instanceof NextResponse) return kq;

  try {
    return NextResponse.json(
      await importPartnerFile(kq.file, {
        sheet: truongText(kq.form, "sheet"),
        role: truongText(kq.form, "role"),
      }),
    );
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}
