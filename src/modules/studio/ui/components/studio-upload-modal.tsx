"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export const StudioUploadModal = () => {
  const utils = api.useUtils();
  const { mutate: createVideo, isPending } = api.video.create.useMutation({
    onSuccess: () => {
      toast.success("Video created successfully");
      void utils.video.getAll.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  return (
    <Button
      variant="secondary"
      onClick={() => createVideo({ title: "Untitled" })}
      disabled={isPending}
    >
      {isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
      Create
    </Button>
  );
};
