import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { useClerk } from "@clerk/nextjs";
import { ThumbsUpIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  videoId: string;
  likeCount: number;
  dislikeCount: number;
  viewerReaction: RouterOutputs["video"]["getPublicVideo"]["viewerReaction"];
};

export const VideoReactions = ({
  videoId,
  likeCount,
  dislikeCount,
  viewerReaction,
}: Props) => {
  const clerk = useClerk();
  const utils = api.useUtils();

  const reactToVideo = api.videoReactions.toggleReaction.useMutation({
    onSuccess: () => utils.video.getPublicVideo.invalidate({ videoId }),
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  return (
    <div className="flex flex-none items-center">
      <Button
        variant="secondary"
        className="gap-2 rounded-l-full rounded-r-none pr-4"
        onClick={() => reactToVideo.mutate({ videoId, type: "like" })}
      >
        <ThumbsUpIcon
          className={cn("size-5", { "fill-black": viewerReaction === "like" })}
        />
        {likeCount}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
        onClick={() => reactToVideo.mutate({ videoId, type: "dislike" })}
      >
        <ThumbsUpIcon
          className={cn("size-5", {
            "fill-black": viewerReaction === "dislike",
          })}
        />
        {dislikeCount}
      </Button>
    </div>
  );
};
