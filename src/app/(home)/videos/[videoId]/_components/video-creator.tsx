import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import type { RouterOutputs } from "@/trpc/react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

type Props = {
  user: RouterOutputs["video"]["getPublicVideo"]["user"];
  videoId: RouterOutputs["video"]["getPublicVideo"]["id"];
};

export const VideoCreator = ({ user, videoId }: Props) => {
  const { userId: clerkUserId } = useAuth();

  const isSubscribed = false;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 sm:items-start sm:justify-start">
      <Link href={`/users/${user.id}`}>
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
          {/* TODO: Build subscriber count */}
          <span className="text-muted-foreground line-clamp-1 text-sm">
            {0} subscribers
          </span>
        </div>
      </Link>
      {user.clerkId === clerkUserId ? (
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href={`/studio/videos/${videoId}`}>Edit video</Link>
        </Button>
      ) : (
        <Button
          onClick={() => null}
          disabled={false}
          className="flex-none rounded-full"
        >
          {isSubscribed ? "Unsubscribe" : "Subscribe"}
        </Button>
      )}
    </div>
  );
};
