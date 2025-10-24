"use client";

import { VideoPlayer } from "@/app/(studio)/studio/videos/[videoId]/_components/video-player";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import React from "react";
import { VideoBanner } from "./video-banner";
import { VideoHeader } from "./video-header";

type Props = {
  videoId: string;
};

export const VideoSection = ({ videoId }: Props) => {
  const [video] = api.video.getPublicVideo.useSuspenseQuery({ videoId });

  return (
    <>
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-xl bg-black",
          {
            "": video.muxStatus !== "ready",
          },
        )}
      >
        <VideoPlayer
          autoPlay
          onPlay={() => null}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
        />
      </div>
      <VideoBanner status={video.muxStatus} />
      <VideoHeader video={video} />
    </>
  );
};
