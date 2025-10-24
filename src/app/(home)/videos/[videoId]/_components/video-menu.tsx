import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VariantProps } from "class-variance-authority";
import {
  ListPlusIcon,
  MoreVerticalIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  videoId: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  onRemove?: () => void;
};

export const VideoMenu = ({ videoId, variant, onRemove }: Props) => {
  const shareUrl = `${process.env.VERCEL_URL ?? "http://localhost:3000"}/videos/${videoId}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon" className="rounded-full">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={() =>
            navigator.clipboard
              .writeText(shareUrl)
              .then(() => toast.success("Link copied to the clipboard"))
          }
        >
          <ShareIcon className="mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => null}>
          <ListPlusIcon className="mr-2" />
          Add to playlist
        </DropdownMenuItem>
        {onRemove && (
          <DropdownMenuItem onClick={() => null}>
            <Trash2Icon className="mr-2" />
            Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
