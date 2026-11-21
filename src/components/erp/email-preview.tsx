"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EmailPreviewDialog({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  email: {
    to: string;
    cc?: string[];
    subject: string;
    body: string;
    timestamp?: string;
  } | null;
}) {
  if (!email) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            Email sent (simulated)
          </DialogTitle>
          <DialogDescription>
            The following email has been dispatched to the recipients below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 text-sm p-1">
            <div>
              <span className="text-muted-foreground font-medium">To: </span>
              <span className="font-mono">{email.to}</span>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div>
                <span className="text-muted-foreground font-medium">CC: </span>
                <span className="font-mono">{email.cc.join(", ")}</span>
              </div>
            )}
            {email.timestamp && (
              <div>
                <span className="text-muted-foreground font-medium">
                  Timestamp:{" "}
                </span>
                <span className="font-mono">
                  {new Date(email.timestamp).toLocaleString("en-GB")}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground font-medium">Subject: </span>
              <span className="font-semibold">{email.subject}</span>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {email.body}
              </pre>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
