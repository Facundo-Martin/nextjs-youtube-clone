import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsUpIcon } from "lucide-react";

export const VideoReactions = () => {
  const viewerReaction = "like";

  return (
    <div className="flex flex-none items-center">
      <Button
        variant="secondary"
        className="gap-2 rounded-l-full rounded-r-none pr-4"
      >
        <ThumbsUpIcon
          className={cn("size-5", { "fill-black": viewerReaction === "like" })}
        />
        {1}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
      >
        <ThumbsUpIcon className={cn("size-5", { "fill-black": false })} />
        {1}
      </Button>
    </div>
  );
};
