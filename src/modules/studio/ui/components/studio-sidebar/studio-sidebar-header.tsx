import { useUser } from "@clerk/nextjs";
import {
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export const StudioSidebarHeader = () => {
  const { user } = useUser();
  const { state } = useSidebar();

  if (!user) {
    return (
      <SidebarHeader className="mb-2 grid place-items-center">
        <Skeleton className="size-[112px] rounded-full" />
        <div className="mt-2 flex flex-col items-center">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </SidebarHeader>
    );
  }

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Your profile" asChild>
          <Link href="/users/curent">
            <UserAvatar
              imageUrl={user.imageUrl}
              name={user.fullName ?? "User"}
              size="xs"
            />
            <span className="text-sm">Your profile</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <div>
      <SidebarHeader className="mb-2 grid place-items-center">
        <Link href="/users/curent">
          <UserAvatar
            imageUrl={user.imageUrl}
            name={user.fullName ?? "User"}
            className="size-[112px] transition-opacity hover:opacity-80"
          />
        </Link>
        <div className="mt-2 flex flex-col items-center">
          <p className="text-sm font-medium">Your profile</p>
          <p className="text-muted-foreground text-xs">{user.fullName}</p>
        </div>
      </SidebarHeader>
    </div>
  );
};
