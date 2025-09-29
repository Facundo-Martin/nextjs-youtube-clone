import { formatDuration } from "@/lib/utils";
import type { SelectVideo } from "@/server/db/schema";
import Image from "next/image";

type Props = {
  title: SelectVideo["title"];
  duration: SelectVideo["duration"];
  imageUrl: SelectVideo["thumbnailUrl"];
  previewUrl: SelectVideo["previewUrl"];
};

export const VideoThumbnail = ({
  title,
  duration,
  imageUrl,
  previewUrl,
}: Props) => {
  return (
    <div className="group relative">
      {/* Thumbnaiul wrapepr */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={imageUrl ?? "/placeholder.svg"}
          alt={title}
          fill
          className="size-full object-cover group-hover:opacity-0"
        />
        <Image
          unoptimized={!!previewUrl}
          src={previewUrl ?? "/placeholder.svg"}
          alt={title}
          fill
          className="size-full object-cover opacity-0 group-hover:opacity-100"
        />
      </div>

      <div className="py- absolute right-2 bottom-2 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
        {formatDuration(duration ?? 0)}
      </div>
    </div>
  );
};
