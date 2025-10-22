import { env } from "@/env";
import { db } from "@/server/db";
import { videos } from "@/server/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

type WorkflowRequest = {
  userId: string;
  videoId: string;
  prompt: string;
};

export const { POST } = serve(async (context) => {
  const utapi = new UTApi();
  const { videoId, userId, prompt } = context.requestPayload as WorkflowRequest;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));

    if (!existingVideo) {
      throw new Error("Not found");
    }

    return existingVideo;
  });

  console.log(video);

  const { body } = await context.call<{ data: { url: string }[] }>(
    "generate-thumbnail",
    {
      url: "https://api.openai.com/v1/images/generations",
      method: "POST",
      body: {
        prompt,
        n: 1,
        model: "dall-e-3",
        size: "1792x1024",
      },
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
    },
  );

  const generatedThumbnailUrl = body.data[0]?.url;

  if (!generatedThumbnailUrl) {
    throw new Error("Bad request");
  }

  const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
    const { data } = await utapi.uploadFilesFromUrl(generatedThumbnailUrl);

    if (!data) {
      throw new Error("Bad request");
    }

    return data;
  });

  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
      await db
        .update(videos)
        .set({ thumbnailKey: null, thumbnailUrl: null })
        .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
    }
  });

  await context.run("update-video-thumbnail", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.ufsUrl,
      })
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
  });
});
