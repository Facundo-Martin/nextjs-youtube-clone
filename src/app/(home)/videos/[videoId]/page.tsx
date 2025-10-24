import { api, HydrateClient } from "@/trpc/server";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoSection } from "./_components/video-section";
import { SuggestionsSection } from "./_components/suggestions-section";
import { CommentsSection } from "./_components/comments-section";

type Props = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: Props) {
  const { videoId } = await params;

  void api.video.getPublicVideo.prefetch({ videoId });

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <ErrorBoundary fallback={null}>
          <div className="mx-auto mb-10 flex max-w-[1700px] flex-col px-4 pt-2.5">
            <div className="flex flex-col gap-6 xl:flex-row">
              <div className="min-w-0 flex-1">
                <VideoSection videoId={videoId} />
                <div className="mt-4 block xl:hidden">
                  <SuggestionsSection />
                </div>
                <CommentsSection />
              </div>
              <div className="hidden w-full shrink-1 xl:block xl:w-[380px] 2xl:w-[460px]">
                <SuggestionsSection />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
