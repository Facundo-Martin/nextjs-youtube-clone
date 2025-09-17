import { Suspense } from "react";

import { api, HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { HomeView } from "@/modules/home/ui/components/views/home-view";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    categoryId?: string;
  }>;
};

// TODO: Rm this in favor of nuqs
export default async function Home({ searchParams }: Props) {
  const { categoryId } = await searchParams;
  void api.category.getAll.prefetch();

  return (
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
}
