CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text,
	"note" text,
	CONSTRAINT "payment_method_hop_le" CHECK ("invoice_payments"."method" IS NULL OR "invoice_payments"."method" IN ('cash','bank_transfer','other')),
	CONSTRAINT "payment_amount_khac_khong" CHECK ("invoice_payments"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tax_code" text,
	"phone" text,
	"email" text,
	"address" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ALTER COLUMN "threshold_qty" SET DATA TYPE numeric(14, 3);--> statement-breakpoint
ALTER TABLE "inventory_transactions" ALTER COLUMN "quantity" SET DATA TYPE numeric(14, 3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock" SET DATA TYPE numeric(14, 3);--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(14, 3);--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN "last_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN "last_run_status" text;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN "last_run_note" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tax_code" text;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "warehouse_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "source_type" text;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "employee_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "linked_product_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_unit" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit_factor" numeric(14, 4) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "warehouse_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "allows_zero_value" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" DROP COLUMN "category_filter";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_last_run_status_hop_le" CHECK ("automation_rules"."last_run_status" IS NULL OR "automation_rules"."last_run_status" IN ('ok','failed'));--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inv_tx_type_hop_le" CHECK ("inventory_transactions"."type" IN ('import','export','adjustment','transfer'));--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inv_tx_source_di_cung_nhau" CHECK (("inventory_transactions"."source_type" IS NULL) = ("inventory_transactions"."source_id" IS NULL));--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inv_tx_source_type_hop_le" CHECK ("inventory_transactions"."source_type" IS NULL OR "inventory_transactions"."source_type" IN ('sale','purchase','stocktake','transfer','manual'));--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inv_tx_quantity_khac_khong" CHECK ("inventory_transactions"."quantity" <> 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unit_factor_duong" CHECK ("products"."unit_factor" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_khong_tu_tro" CHECK ("products"."linked_product_id" IS NULL OR "products"."linked_product_id" <> "products"."id");--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "invoice_item_quantity_khac_khong" CHECK ("sales_invoice_items"."quantity" <> 0);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_hop_le" CHECK ("users"."role" IN ('staff','manager','admin'));