import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { ResponsiveModal } from "@/components/responsive-dialog";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing";
import { api } from "@/trpc/react";

type Props = {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ThumbnailUploadModal = ({
  videoId,
  open,
  onOpenChange,
}: Props) => {
  const utils = api.useUtils();

  const onUploadComplete = () => {
    void utils.video.getAll.invalidate();
    void utils.video.get.invalidate({ videoId });
    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      title="Upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
        onUploadError={(error: Error) => {
          alert(`ERROR! ${error.message}`);
        }}
      />
    </ResponsiveModal>
  );
};
