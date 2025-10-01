import { api, HydrateClient } from "@/trpc/server";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoForm, VideoFormSkeleton } from "./_components/video-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: Props) {
  const { videoId } = await params;
  void api.video.get.prefetch({ videoId });
  void api.category.getAll.prefetch();

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <ErrorBoundary fallback={<VideoFormSkeleton />}>
          <div className="max-w-screen-lg px-4 pt-2.5">
            <VideoForm videoId={videoId} />
          </div>
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
