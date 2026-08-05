import { NextResponse } from "next/server";
import {
  brainErrorToHttp,
  deleteKnowledgeDocument,
  listKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/server/brain";
import { getSessionUser } from "@/server/session";

/**
 * Tài liệu nội bộ đưa vào kho tri thức: hợp đồng, bảng giá cước, quy định
 * giao nhận, chính sách công nợ.
 *
 * `workspace_id` KHÔNG lấy từ client. Nếu để client gửi thì bất kỳ ai cũng đọc
 * được tài liệu của khách khác chỉ bằng cách đổi một tham số — và đó là loại lỗi
 * không sửa được sau khi đã xảy ra. Ở đây nó là hằng số phía máy chủ.
 */

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Phạm vi tri thức của lần cài đặt này.
 *
 * Bản đầu lấy `warehouses[0].id` làm khoá. Sai — vì lúc CHAT, Body gửi kho đang
 * chọn, không phải kho đầu tiên. Đứng ở kho thứ hai mà hỏi thì mọi tài liệu đã
 * nạp trở nên vô hình, và biểu hiện duy nhất là "không tìm thấy": không lỗi,
 * không cảnh báo, giao diện vẫn liệt kê đủ tài liệu.
 *
 * Hợp đồng và bảng giá cước là của CẢ CÔNG TY, không của riêng kho hàng nào,
 * nên khoá phạm vi tách hẳn khỏi kho. Phải khớp `KB_WORKSPACE_ID` bên Brain —
 * hai bên cùng mặc định "default" nên không cấu hình gì thì vẫn khớp.
 */
function workspaceId(): string {
  return process.env.BRAIN_KB_WORKSPACE?.trim() || "default";
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    return NextResponse.json({ documents: await listKnowledgeDocuments(workspaceId()) });
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Cần gửi dạng multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB, tối đa 5MB)` },
      { status: 413 },
    );
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };

  try {
    const result = await uploadKnowledgeDocument(file, {
      workspaceId: workspaceId(),
      effectiveFrom: str("effective_from"),
      effectiveTo: str("effective_to"),
      docType: str("doc_type"),
    });
    return NextResponse.json(result);
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const source = new URL(request.url).searchParams.get("source");
  if (!source) return NextResponse.json({ error: "Thiếu tên tài liệu" }, { status: 400 });

  try {
    await deleteKnowledgeDocument(workspaceId(), source);
    return NextResponse.json({ source, deleted: true });
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}
