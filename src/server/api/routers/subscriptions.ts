import { z } from "zod";

import { and, eq } from "drizzle-orm";
import { subscriptions } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const subscriptionRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ creatorId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .insert(subscriptions)
        .values({ creatorId: input.creatorId, viewerId: ctx.user.id })
        .returning();

      return data;
    }),
  delete: protectedProcedure
    .input(z.object({ creatorId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [data] = await ctx.db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.creatorId, input.creatorId),
            eq(subscriptions.viewerId, ctx.user.id),
          ),
        )
        .returning();

      return data;
    }),
});
