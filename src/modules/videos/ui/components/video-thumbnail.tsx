import Image from "next/image";

type Props = {
  imageUrl?: string | null;
};

export const VideoThumbnail = ({ imageUrl }: Props) => {
  return (
    <div className="relative">
      {/* Thumbnaiul wrapepr */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={imageUrl ?? "/placeholder.svg"}
          alt="Thumbnail"
          fill
          className="size-full object-cover"
        />
      </div>

      <div></div>
    </div>
  );
};
