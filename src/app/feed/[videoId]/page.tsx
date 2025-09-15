type Props = {
  params: Promise<{ videoId: string }>;
};

export default async function VideoPage({ params }: Props) {
  const { videoId } = await params;
  return <div>Video Id Page: {videoId}</div>;
}
