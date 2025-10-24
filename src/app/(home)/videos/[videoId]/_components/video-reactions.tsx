import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { useClerk, useUser } from "@clerk/nextjs";
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
  const { isSignedIn } = useUser();
  const utils = api.useUtils();

  const reactToVideo = api.videoReactions.toggleReaction.useMutation({
    onSuccess: () => utils.video.getPublicVideo.invalidate({ videoId }),
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onReact = (type: "like" | "dislike") => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }

    reactToVideo.mutate({ videoId, type });
  };

  return (
    <div className="flex flex-none items-center">
      <Button
        variant="secondary"
        className="gap-2 rounded-l-full rounded-r-none pr-4"
        onClick={() => onReact("like")}
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
        onClick={() => onReact("dislike")}
      >
        <ThumbsUpIcon
          className={cn("size-5 rotate-180", {
            "fill-black": viewerReaction === "dislike",
          })}
        />
        {dislikeCount}
      </Button>
    </div>
  );
};
