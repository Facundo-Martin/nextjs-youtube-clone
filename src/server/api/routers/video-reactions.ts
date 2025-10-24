import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { videoReactions } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const videoReactionsRouter = createTRPCRouter({
  toggleReaction: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        type: z.enum(["like", "dislike"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existingReaction] = await ctx.db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId, input.videoId),
            eq(videoReactions.userId, ctx.user.id),
          ),
        );

      // If reaction exists and is the same type, remove it (toggle off)
      if (existingReaction && existingReaction.type === input.type) {
        const [deletedReaction] = await ctx.db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.videoId, input.videoId),
              eq(videoReactions.userId, ctx.user.id),
            ),
          )
          .returning();

        return { action: "removed", reaction: deletedReaction };
      }

      // If reaction exists but is different type, update it
      if (existingReaction && existingReaction.type !== input.type) {
        const [updatedReaction] = await ctx.db
          .update(videoReactions)
          .set({
            type: input.type,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(videoReactions.videoId, input.videoId),
              eq(videoReactions.userId, ctx.user.id),
            ),
          )
          .returning();

        return { action: "updated", reaction: updatedReaction };
      }

      // No existing reaction, create new one
      const [createdReaction] = await ctx.db
        .insert(videoReactions)
        .values({
          userId: ctx.user.id,
          videoId: input.videoId,
          type: input.type,
        })
        .returning();

      return { action: "created", reaction: createdReaction };
    }),
});
