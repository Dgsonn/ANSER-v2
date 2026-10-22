import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Script nạp dữ liệu một lần, không thuộc ứng dụng, và đã cũ so với schema hiện tại.
    // Chưa quyết giữ hay bỏ (BLOCKERS.md D3) — loại khỏi lint thay vì sửa một file chưa
    // ai xác nhận còn dùng. Cũng bị loại khỏi tsconfig.json vì cùng lý do.
    "import-real-data.ts",
  ]),
]);

export default eslintConfig;
