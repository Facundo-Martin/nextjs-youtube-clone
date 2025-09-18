import { DEFAULT_QUERY_LIMIT } from "@/lib/constants";
import { StudioView } from "@/modules/studio/ui/components/views/studio-view";
import { api, HydrateClient } from "@/trpc/server";

export default async function StudioPage() {
  void api.video.getAll.prefetchInfinite({ limit: DEFAULT_QUERY_LIMIT });

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
}
