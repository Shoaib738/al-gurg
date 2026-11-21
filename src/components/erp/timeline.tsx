"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "./primitives";

export function TimelineStrip({
  events,
  className,
  emptyHint = "No timeline events yet",
}: {
  events?: Array<{
    id?: string;
    stage: string;
    message: string;
    createdAt: string | Date;
    user?: { name?: string } | null;
  }>;
  className?: string;
  emptyHint?: string;
}) {
  if (!events || events.length === 0) {
    return <EmptyState title={emptyHint} />;
  }
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Project Timeline</CardTitle>
        <CardDescription>
          {events.length} event{events.length !== 1 ? "s" : ""} recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          <ol className="relative border-l border-amber-300/60 ml-4 mr-4 pb-4">
            {events.map((e, i) => (
              <li key={e.id || i} className="ml-4 pb-4 last:pb-0">
                <span className="absolute -left-[7px] mt-1 size-3 rounded-full bg-amber-600 ring-4 ring-amber-100 dark:ring-amber-950" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-medium">{e.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(e.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stage: {e.stage}
                  {e.user?.name ? ` • by ${e.user.name}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
