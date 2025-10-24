import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { videoViews } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const videoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existingVideoView] = await ctx.db
        .select()
        .from(videoViews)
        .where(
          and(
            eq(videoViews.videoId, input.videoId),
            eq(videoViews.userId, ctx.user.id),
          ),
        );

      if (existingVideoView) {
        return existingVideoView;
      }

      const [createdVideoView] = await ctx.db
        .insert(videoViews)
        .values({ userId: ctx.user.id, videoId: input.videoId })
        .returning();

      return createdVideoView;
    }),
});
