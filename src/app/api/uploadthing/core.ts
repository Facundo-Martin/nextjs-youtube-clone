import { db } from "@/server/db";
import { users, videos } from "@/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import z from "zod";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  thumbnailUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({ videoId: z.uuid() }))
    // This code runs on your server before upload
    .middleware(async ({ input }) => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError("Unauthorized") as Error;

      const [user] = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) throw new UploadThingError("Not Found") as Error;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, ...input };
    })
    // This code RUNS ON YOUR SERVER after upload
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({ thumbnailUrl: file.ufsUrl })
        .where(
          and(
            eq(videos.id, metadata.videoId),
            eq(videos.userId, metadata.userId),
          ),
        );
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
