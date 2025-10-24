import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  users,
  videoReactions,
  videos,
  videoUpdateSchema,
  videoViews,
} from "@/server/db/schema";
import { and, desc, eq, getTableColumns, inArray, lt, or } from "drizzle-orm";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { UTApi } from "uploadthing/server";
import { workflow } from "@/lib/qstash";
import { env } from "@/env";

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
  getPublicVideo: publicProcedure
    .input(z.object({ videoId: z.uuid().min(1) }))
    .query(async ({ ctx, input }) => {
      //  Note: We use auth object cause it's a public procedure so we don't have access to the user object
      const { clerkUserId } = ctx.auth;

      // Only fetch userId if clerkUserId exists
      let userId: string | undefined;

      if (clerkUserId) {
        const [user] = await ctx.db
          .select({
            userId: users.id,
          })
          .from(users)
          .where(eq(users.clerkId, clerkUserId));

        userId = user?.userId;
      }

      const viewerReactionsCte = ctx.db.$with("viewer_reactions").as(
        ctx.db
          .select({
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : [])),
      );

      const [video] = await ctx.db
        .with(viewerReactionsCte)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
          },
          videoViews: ctx.db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id),
          ),
          likeCount: ctx.db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like"),
            ),
          ),
          dislikeCount: ctx.db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike"),
            ),
          ),
          viewerReaction: viewerReactionsCte.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerReactionsCte, eq(viewerReactionsCte.videoId, videos.id))
        .where(and(eq(videos.id, input.videoId)))
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

      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.png`;

      const utapi = new UTApi();

      const uploadedThumbnail =
        await utapi.uploadFilesFromUrl(tempThumbnailUrl);

      if (!uploadedThumbnail?.data) {
        return new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
        uploadedThumbnail.data;

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl, thumbnailKey })
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({ videoId: z.string(), prompt: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        retries: 3,
        keepTriggerConfig: true,
        body: { userId, videoId: input.videoId, prompt: input.prompt },
      });

      return workflowRunId;
    }),
  generateTitle: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        retries: 3,
        keepTriggerConfig: true,
        body: { userId, videoId: input.videoId },
      });

      return workflowRunId;
    }),
  generateDescription: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        retries: 3,
        keepTriggerConfig: true,
        body: { userId, videoId: input.videoId },
      });

      return workflowRunId;
    }),
});
