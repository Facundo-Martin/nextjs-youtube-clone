ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_pk" PRIMARY KEY("viewer_id","creator_id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "creator_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;