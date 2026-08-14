// Phép tính giá vốn — thuần, không đụng DB.
//
// Tách riêng khỏi `inventory.ts` để kiểm được mà không cần dựng cả kết nối
// Postgres. Đây là chỗ dễ sai nhất và sai thì không ai thấy: một con số giá vốn
// bịa ra vẫn chảy êm qua mọi tầng rồi hiện lên như một tỷ suất lãi chắc nịch.

/**
 * Giá vốn bình quân gia quyền sau một lần nhập.
 *
 * Trả `null` khi CHƯA ĐỦ CƠ SỞ để tính — và `null` phải được giữ nguyên là
 * "chưa biết", tuyệt đối không quy về 0. Ba trường hợp trả null / giữ nguyên:
 *
 *  - Phiếu nhập không ghi đơn giá (`inCost === null`): không có gì mới để bình
 *    quân vào, giữ nguyên giá vốn cũ.
 *  - Hàng đang có tồn nhưng tồn đó CHƯA CÓ giá vốn (`oldCost === null`): lấy
 *    đơn giá lô mới gán cho toàn bộ tồn cũ là bịa ra một con số cho phần chưa
 *    biết. Thà để trống — báo cáo tự hạ độ tin cậy, còn hơn ra một tỷ suất lãi
 *    trông rất chắc chắn mà dựa trên số tự nghĩ.
 *  - Tồn cũ <= 0 (hết hàng, hoặc đang âm do sổ lệch): không có gì để bình quân,
 *    giá lô mới thành giá vốn hiện hành.
 */
export function weightedAverageCost(args: {
  oldStock: number;
  oldCost: number | null;
  inQty: number;
  inCost: number | null;
}): number | null {
  const { oldStock, oldCost, inQty, inCost } = args;
  if (inCost === null || inQty <= 0) return oldCost;
  if (oldStock <= 0) return inCost;
  if (oldCost === null) return null;
  return Math.round((oldStock * oldCost + inQty * inCost) / (oldStock + inQty));
}
