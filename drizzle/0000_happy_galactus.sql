CREATE TABLE "airlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bottle_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"airline_id" integer NOT NULL,
	"empty" text NOT NULL,
	"partial" text NOT NULL,
	"full" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" serial PRIMARY KEY NOT NULL,
	"airline_id" integer NOT NULL,
	"flight_number" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"expiration_date" date NOT NULL,
	"type" text NOT NULL,
	"sticker_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stickers" (
	"id" serial PRIMARY KEY NOT NULL,
	"shape" text NOT NULL,
	"color" text NOT NULL,
	"caducity_date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bottle_rules" ADD CONSTRAINT "bottle_rules_airline_id_airlines_id_fk" FOREIGN KEY ("airline_id") REFERENCES "public"."airlines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_airline_id_airlines_id_fk" FOREIGN KEY ("airline_id") REFERENCES "public"."airlines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sticker_id_stickers_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."stickers"("id") ON DELETE no action ON UPDATE no action;