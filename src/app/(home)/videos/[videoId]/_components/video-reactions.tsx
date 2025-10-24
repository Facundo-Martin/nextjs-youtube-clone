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

  // Note: Optimistic updates following: https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates#updating-a-list-of-todos-when-adding-a-new-todo
  const reactToVideo = api.videoReactions.toggleReaction.useMutation({
    onMutate: async ({ type }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await utils.video.getPublicVideo.cancel({ videoId });

      // Snapshot the previous value
      const previousData = utils.video.getPublicVideo.getData({ videoId });

      // Optimistically update to the new value
      if (previousData) {
        utils.video.getPublicVideo.setData({ videoId }, (old) => {
          if (!old) return old;

          let newLikeCount = old.likeCount;
          let newDislikeCount = old.dislikeCount;
          let newViewerReaction = old.viewerReaction;

          // Handle like button click
          if (type === "like") {
            if (viewerReaction === "like") {
              // Remove like
              newLikeCount--;
              newViewerReaction = null;
            } else if (viewerReaction === "dislike") {
              // Switch from dislike to like
              newDislikeCount--;
              newLikeCount++;
              newViewerReaction = "like";
            } else {
              // Add like
              newLikeCount++;
              newViewerReaction = "like";
            }
          }

          // Handle dislike button click
          else if (type === "dislike") {
            if (viewerReaction === "dislike") {
              // Remove dislike
              newDislikeCount--;
              newViewerReaction = null;
            } else if (viewerReaction === "like") {
              // Switch from like to dislike
              newLikeCount--;
              newDislikeCount++;
              newViewerReaction = "dislike";
            } else {
              // Add dislike
              newDislikeCount++;
              newViewerReaction = "dislike";
            }
          }

          return {
            ...old,
            likeCount: newLikeCount,
            dislikeCount: newDislikeCount,
            viewerReaction: newViewerReaction,
          };
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_, __, context) => {
      if (context?.previousData) {
        utils.video.getPublicVideo.setData({ videoId }, context.previousData);
      }
      toast.error("Something went wrong");
    },
    // Always refetch after error or success:
    onSettled: () => {
      void utils.video.getPublicVideo.invalidate({ videoId });
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
