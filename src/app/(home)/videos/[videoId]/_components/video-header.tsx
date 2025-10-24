import type { RouterOutputs } from "@/trpc/react";
import { VideoAuthor } from "./video-author";
import { VideoReactions } from "./video-reactions";
import { VideoMenu } from "./video-menu";
import { VideoDescription } from "./video-description";
import { format, formatDistanceToNow } from "date-fns";

type Props = {
  video: RouterOutputs["video"]["getPublicVideo"];
};

export const VideoHeader = ({ video }: Props) => {
  const compactViews = Intl.NumberFormat("en", {
    notation: "compact",
  }).format(12);
  const expandedViews = Intl.NumberFormat("en", {
    notation: "standard",
  }).format(12);

  const compactDate = formatDistanceToNow(video.createdAt, { addSuffix: true });
  const expandedDate = format(video.createdAt, "d MMM yyyy");

  return (
    <div className="mt-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <VideoAuthor user={video.user} videoId={video.id} />
        <div className="sm -mb-2 flex gap-2 overflow-x-auto pb-2 sm:mb-0 sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible sm:pb-0">
          <VideoReactions />
          <VideoMenu videoId={video.id} variant="secondary" />
        </div>
      </div>
      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  );
};
