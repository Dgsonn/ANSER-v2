"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import FloatingInput from "@/components/FloatingInput";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message ?? "Đăng ký thất bại.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      brandTitle="Tạo tài khoản"
      brandSubtitle="Thiết lập không gian làm việc hiệu quả của bạn chỉ tại một nơi duy nhất."
      formTitle="Bắt đầu ngay"
      formSubtitle="Bước vào hành trình quản lý thông minh cùng ANSER"
      switchText="Đã có tài khoản?"
      switchLinkLabel="Đăng nhập ngay"
      switchHref="/login"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            id="first_name"
            type="text"
            label="Họ"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <FloatingInput
            id="last_name"
            type="text"
            label="Tên"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <FloatingInput
          id="email"
          type="email"
          label="Địa chỉ Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FloatingInput
          id="phone"
          type="tel"
          label="Số điện thoại (tùy chọn)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <FloatingInput
          id="password"
          type="password"
          label="Mật khẩu (ít nhất 6 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white py-4 text-[15px] font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(255,255,255,0.2)] disabled:opacity-60"
        >
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>
      </form>
    </AuthShell>
  );
}
