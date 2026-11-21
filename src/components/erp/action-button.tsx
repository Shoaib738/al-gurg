"use client";

import { useAction } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ActionButton({
  action,
  payload,
  label,
  variant = "default",
  size,
  icon: Icon,
  onSuccess,
  successMessage,
  requireConfirm,
  confirmText,
  className,
  disabled,
}: {
  action: string;
  payload?: Record<string, any>;
  label: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  icon?: any;
  onSuccess?: (data: any) => void;
  successMessage?: string;
  requireConfirm?: boolean;
  confirmText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const mutation = useAction();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || mutation.isPending}
      className={className}
      onClick={async () => {
        if (requireConfirm) {
          const ok = window.confirm(confirmText || `Confirm: ${label}?`);
          if (!ok) return;
        }
        mutation.mutate(
          { action, ...(payload || {}) },
          {
            onSuccess: (data) => {
              toast.success(successMessage || "Done");
              onSuccess?.(data);
            },
            onError: (err: any) => {
              toast.error(err.message || "Action failed");
            },
          }
        );
      }}
    >
      {mutation.isPending && (
        <Loader2 className="size-4 animate-spin" />
      )}
      {Icon && !mutation.isPending && <Icon className="size-4" />}
      {label}
    </Button>
  );
}
