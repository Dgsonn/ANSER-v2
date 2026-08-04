ALTER TABLE "inventory_transactions" ADD COLUMN "unit_cost" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost" integer;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD COLUMN "unit_cost" integer;