ALTER TABLE "videos" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "thumbnail_key" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "preview_key" text;--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "thumnail_url";