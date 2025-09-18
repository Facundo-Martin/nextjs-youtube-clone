import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { videos } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const videoRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [video] = await ctx.db
        .select()
        .from(videos)
        .where(eq(videos.id, input.videoId))
        .limit(1);

      return video;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const allVideos = await ctx.db.select().from(videos);
    return allVideos;
  }),
});
