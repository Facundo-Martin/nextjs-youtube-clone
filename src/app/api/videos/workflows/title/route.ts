import { db } from "@/server/db";
import { videos } from "@/server/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

type WorkflowRequest = {
  userId: string;
  videoId: string;
};

const TITLE_GENERATION_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(async (context) => {
  const { videoId, userId } = context.requestPayload as WorkflowRequest;

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

  const { status, body } = await context.api.openai.call("generate-title", {
    token: process.env.OPENAI_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: TITLE_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content:
            "Hi eveyone, in this video we will be creating a Youtube clone'",
        },
      ],
    },
  });

  // get text:
  const title = body.choices[0]?.message.content;

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({ title: title ?? video.title })
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));
  });

  await context.run("second-step", () => {
    console.log("second step ran");
  });
});
