import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  compactViews: string;
  expandedViews: string;
  compactDate: string;
  expandedDate: string;
  description?: string | null;
};

export const VideoDescription = ({
  compactViews,
  expandedViews,
  compactDate,
  expandedDate,
  description,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded((current) => !current)}
      className="bg-secondary/50 hover:bg-secondary/70 cursor-pointer rounded-xl p-3 transition"
    >
      <div className="mb-2 flex gap-2 text-sm">
        <span className="font-medium">
          {isExpanded ? expandedViews : compactViews} views
        </span>
        <span className="font-medium">
          {isExpanded ? expandedDate : compactDate}
        </span>
      </div>
      <div className="relative">
        <p
          className={cn(
            "text-sm whitespace-pre-wrap",
            !isExpanded && "line-clamp-2",
          )}
        >
          {description ?? "No description"}
        </p>
        <div className="mt-4 flex items-center gap-1 text-sm font-medium">
          {isExpanded ? (
            <>
              Show less <ChevronUpIcon className="size-4" />
            </>
          ) : (
            <>
              Show more <ChevronDownIcon className="size-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
