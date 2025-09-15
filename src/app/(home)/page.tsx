import { api } from "@/trpc/server";
import Image from "next/image";

export default async function Home() {
  void api.post.getLatest.prefetch();

  return (
    <div>
      <Image src="/logo.svg" height={50} width={50} alt="Logo" />
      <p className="text-xl font-semibold tracking-tight">Home page</p>
    </div>
  );
}
