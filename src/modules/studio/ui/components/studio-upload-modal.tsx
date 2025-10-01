"use client";

import { ResponsiveModal } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { StudioUploader } from "./studio-uploader";
import { useRouter } from "next/navigation";

export const StudioUploadModal = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const createVideo = api.video.create.useMutation({
    onSuccess: () => {
      toast.success("Video created successfully");
      void utils.video.getAll.invalidate();
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const onSuccess = () => {
    if (!createVideo.data?.video) return;

    createVideo.reset();
    router.push(`/studio/videos/${createVideo.data.video.id}`);
  };

  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!createVideo.data?.uploadUrl}
        onOpenChange={createVideo.reset}
      >
        {createVideo.data?.uploadUrl ? (
          <StudioUploader
            endpoint={createVideo.data?.uploadUrl}
            onSuccess={onSuccess}
          />
        ) : (
          <Loader2Icon />
        )}
      </ResponsiveModal>
      <Button
        variant="secondary"
        onClick={() => createVideo.mutate({ title: "Untitled" })}
        disabled={createVideo.isPending}
      >
        {createVideo.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlusIcon />
        )}
        Create
      </Button>
    </>
  );
};
