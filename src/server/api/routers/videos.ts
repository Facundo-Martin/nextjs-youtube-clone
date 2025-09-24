import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { videos } from "@/server/db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { mux } from "@/lib/mux";

export const videoRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [video] = await ctx.db
        .select()
        .from(videos)
        .where(eq(videos.id, input.videoId))
        .limit(1);

      return video;
    }),
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const upload = await mux.video.uploads.create({
        cors_origin: "*", // TODO: In prod, update the url
        new_asset_settings: {
          passthrough: userId,
          playback_policies: ["public"],
          static_renditions: [{ resolution: "highest" }],
          video_quality: "basic",
        },
      });

      const [video] = await ctx.db
        .insert(videos)
        .values({
          userId,
          title: input.title,
        })
        .returning();

      return { video, uploadUrl: upload.url };
    }),
  getAll: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.uuid(),
            // TODO: Rm this in favor of `createdAt`
            updatedAt: z.date(),
          })
          .optional(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;

      const data = await ctx.db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      // Determine if there are more items
      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;

      // Generate next cursor from the last item
      const nextCursor =
        hasNextPage && items.length > 0
          ? {
              id: items[items.length - 1]!.id,
              updatedAt: items[items.length - 1]!.updatedAt,
            }
          : null;

      return { items, nextCursor, hasNextPage };
    }),
});
