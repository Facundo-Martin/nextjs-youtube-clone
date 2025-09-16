import { api, HydrateClient } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function Home() {
  const user = await auth();
  void api.user.get.prefetch({ clerkId: user.userId! });

  return (
    <HydrateClient>
      <Suspense>
        <ErrorBoundary fallback={<p>Error...</p>}>
          <Image src="/logo.svg" height={50} width={50} alt="Logo" />
          <p className="text-xl font-semibold tracking-tight">Home page</p>
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
