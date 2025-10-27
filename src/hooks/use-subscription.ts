"use client";

import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/trpc/react";

interface UseSubscriptionProps {
  creatorId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  creatorId,
  isSubscribed,
  fromVideoId,
}: UseSubscriptionProps) => {
  const clerk = useClerk();
  const utils = api.useUtils();

  const subscribe = api.subscription.create.useMutation({
    onSuccess: () => {
      toast.success("Subscribed");

      if (fromVideoId) {
        void utils.video.getPublicVideo.invalidate({ videoId: fromVideoId });
      }
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const unsubscribe = api.subscription.delete.useMutation({
    onSuccess: () => {
      toast.success("Subscribed");

      if (fromVideoId) {
        void utils.video.getPublicVideo.invalidate({ videoId: fromVideoId });
      }
    },
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const isPending = subscribe.isPending || unsubscribe.isPending;

  const onClick = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ creatorId });
    } else {
      subscribe.mutate({ creatorId });
    }
  };

  return {
    isPending,
    onClick,
  };
};
