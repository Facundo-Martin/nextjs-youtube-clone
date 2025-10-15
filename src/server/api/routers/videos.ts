import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { videos, videoUpdateSchema } from "@/server/db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { UTApi } from "uploadthing/server";

export const videoRouter = createTRPCRouter({
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
          input: [
            { generated_subtitles: [{ language_code: "en", name: "English" }] },
          ],
        },
      });

      const [video] = await ctx.db
        .insert(videos)
        .values({
          userId,
          title: input.title,
          muxStatus: "waiting",
          muxUploadId: upload.id,
        })
        .returning();

      return { video, uploadUrl: upload.url };
    }),
  get: protectedProcedure
    .input(z.object({ videoId: z.uuid().min(1) }))
    .query(async ({ ctx, input }) => {
      const [video] = await ctx.db
        .select()
        .from(videos)
        .where(
          and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id)),
        )
        .limit(1);

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return video;
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

  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await ctx.db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { updatedVideo };
    }),

  delete: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.videoId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [deletedVideo] = await ctx.db
        .delete(videos)
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)))
        .returning();

      if (!deletedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { deletedVideo };
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();

        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)));
      }

      if (!existingVideo.muxPlaybackId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const thumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.png`;

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl })
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),
});
