CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'ANSER' NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"tax_code" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
