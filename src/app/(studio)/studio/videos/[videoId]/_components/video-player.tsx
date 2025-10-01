import MuxPlayer from "@mux/mux-player-react";

type VideoPlayerProps = {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
};

export const VideoPlayer = ({
  autoPlay,
  onPlay,
  playbackId,
  thumbnailUrl,
}: VideoPlayerProps) => {
  if (!playbackId) {
    return null;
  }

  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={thumbnailUrl ?? "/placeholder.svg"}
      playerInitTime={0}
      autoPlay={autoPlay}
      thumbnailTime={0}
      className="size-full object-contain"
      accentColor="#FF2056"
      onPlay={onPlay}
    />
  );
};
