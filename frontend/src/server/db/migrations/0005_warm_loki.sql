ALTER TABLE "products" ADD COLUMN "unit" text DEFAULT 'Cái' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD COLUMN "unit" text DEFAULT 'Cái' NOT NULL;