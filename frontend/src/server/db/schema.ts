import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  // Email nhận cảnh báo tồn kho thấp / báo cáo doanh số định kỳ qua n8n cho kho này.
  notificationEmail: text("notification_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Nhân viên (hồ sơ nhân sự) — tách riêng khỏi `users` (tài khoản đăng nhập): 1 nhân viên có thể
// không có tài khoản đăng nhập, và 1 tài khoản có thể gắn với 1 hồ sơ nhân viên (users.employeeId).
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  position: text("position"), // chức vụ, vd "Lái xe", "Thủ kho", "Nhân viên bán hàng"
  phone: text("phone"),
  email: text("email"),
  hireDate: timestamp("hire_date", { withTimezone: true }),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  // Phân quyền 3 cấp, giống ANSER Flask (core/security.py ROLE_RANK): "staff" < "manager" < "admin".
  // Hiện chỉ trang Nhân sự tự kiểm tra role này — các trang khác (Sản phẩm, Bán hàng...) chưa
  // chặn theo quyền, xem mục 7 ARCHITECTURE.md.
  role: text("role").notNull().default("staff"),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull().default("Cái"),
  stock: integer("stock").notNull().default(0),
  price: integer("price").notNull().default(0),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "import" | "export"
  quantity: integer("quantity").notNull(),
  counterparty: text("counterparty"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salesInvoices = pgTable("sales_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  note: text("note"),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salesInvoiceItems = pgTable("sales_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => salesInvoices.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  // Snapshot of the product at sale time — revenue history must stay correct
  // even if the product's price changes later or the product is deleted.
  productName: text("product_name").notNull(),
  unit: text("unit").notNull().default("Cái"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
});

// Luôn chỉ có đúng 1 dòng (singleton) — xem ensureCompanySettingsRow() trong lib/store/settings.ts.
export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("ANSER"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  taxCode: text("tax_code"),
  currency: text("currency").notNull().default("VND"), // "VND" | "USD"
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull().default("low_stock_alert"),
  thresholdQty: integer("threshold_qty"),
  categoryFilter: text("category_filter"),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  enabled: boolean("enabled").notNull().default(true),
  // ID workflow thật bên n8n (dán thủ công sau khi import workflow qua n8n UI — n8n không có
  // API import tự động dùng ở đây). Có giá trị này thì nút Chạy/Dừng/Lịch sử mới gọi n8n API
  // thật; không có thì chỉ là bookkeeping riêng của app.
  n8nWorkflowId: text("n8n_workflow_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
