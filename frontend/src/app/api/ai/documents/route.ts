import { NextResponse } from "next/server";
import {
  brainErrorToHttp,
  deleteKnowledgeDocument,
  listKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/server/brain";
import { getSessionUser } from "@/server/session";
import { listWarehouses } from "@/server/store/warehouses";

/**
 * Tài liệu nội bộ đưa vào kho tri thức: hợp đồng, bảng giá cước, quy định
 * giao nhận, chính sách công nợ.
 *
 * `workspace_id` KHÔNG lấy từ client. Nếu để client gửi thì bất kỳ ai cũng đọc
 * được tài liệu của khách khác chỉ bằng cách đổi một tham số — và đó là loại lỗi
 * không sửa được sau khi đã xảy ra. Ở đây nó suy ra từ dữ liệu máy chủ.
 */

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Phạm vi tri thức của lần cài đặt này.
 *
 * Hiện tại một lần cài phục vụ MỘT công ty, nên lấy kho đầu tiên làm khoá. Khi
 * nào bán cho khách thứ hai thì đây là chỗ DUY NHẤT phải sửa — và cố ý gom về
 * một hàm để không ai phải đi tìm.
 */
async function workspaceId(): Promise<string | null> {
  const warehouses = await listWarehouses();
  return warehouses[0]?.id ?? null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const ws = await workspaceId();
  if (!ws) return NextResponse.json({ documents: [] });

  try {
    return NextResponse.json({ documents: await listKnowledgeDocuments(ws) });
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const ws = await workspaceId();
  if (!ws) return NextResponse.json({ error: "Chưa có kho nào" }, { status: 409 });

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
      workspaceId: ws,
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

  const ws = await workspaceId();
  if (!ws) return NextResponse.json({ error: "Chưa có kho nào" }, { status: 409 });

  try {
    await deleteKnowledgeDocument(ws, source);
    return NextResponse.json({ source, deleted: true });
  } catch (error) {
    const { status, body, headers } = brainErrorToHttp(error);
    return NextResponse.json(body, { status, headers });
  }
}
