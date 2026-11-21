"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, X, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadButtonProps {
  category?: string;
  refType?: string;
  refId?: string;
  accept?: string;
  multiple?: boolean;
  onUploaded: (urls: { url: string; filename: string }[]) => void;
  label?: string;
  variant?: "default" | "outline" | "secondary";
}

export function FileUploadButton({
  category = "attachment",
  refType,
  refId,
  accept = "image/*,application/pdf",
  multiple = false,
  onUploaded,
  label = "Upload file",
  variant = "outline",
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const results: { url: string; filename: string }[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10 MB limit`);
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        form.append("category", category);
        if (refType) form.append("refType", refType);
        if (refId) form.append("refId", refId);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`Failed to upload ${file.name}: ${data.error}`);
          continue;
        }
        results.push({ url: data.url, filename: data.filename });
      }
      if (results.length > 0) {
        onUploaded(results);
        toast.success(`${results.length} file(s) uploaded`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <UploadCloud className="size-3.5" />
        )}
        {label}
      </Button>
    </>
  );
}

interface UploadedFileChipProps {
  url: string;
  filename: string;
  onRemove?: () => void;
}

export function UploadedFileChip({ url, filename, onRemove }: UploadedFileChipProps) {
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  return (
    <div className="inline-flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs">
      {isImage ? (
        <ImageIcon className="size-3.5 text-amber-700" />
      ) : (
        <FileText className="size-3.5 text-amber-700" />
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate max-w-[180px] hover:underline"
      >
        {filename}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Remove file"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
