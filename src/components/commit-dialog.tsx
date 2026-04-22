"use client";

import { useState } from "react";
import { GitCommitVertical, Loader2, Check, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "idle" | "committing" | "success" | "error";

export function CommitDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const { files } = useStore();

  const fileCount = files.filter((f) => f.type === "file").length;

  async function handleCommit() {
    if (!message.trim()) return;

    setStatus("committing");
    setFeedback("");

    try {
      const res = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error || "Something went wrong");
        return;
      }

      setStatus("success");
      setFeedback(data.message || "Done");
      setTimeout(() => {
        setOpen(false);
        setMessage("");
        setStatus("idle");
        setFeedback("");
      }, 1500);
    } catch {
      setStatus("error");
      setFeedback("Network error — is the dev server running?");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setStatus("idle");
          setFeedback("");
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={<DialogTrigger />}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <GitCommitVertical className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Commit & Push</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commit & Push</DialogTitle>
          <DialogDescription>
            Save {fileCount} {fileCount === 1 ? "file" : "files"} to the{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/</code>{" "}
            folder and push to remote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Commit message..."
            rows={3}
            disabled={status === "committing" || status === "success"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleCommit();
            }}
          />

          {feedback && (
            <div
              className={`flex items-center gap-2 text-sm ${
                status === "error"
                  ? "text-destructive"
                  : status === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
              }`}
            >
              {status === "success" && <Check className="h-3.5 w-3.5" />}
              {status === "error" && <AlertCircle className="h-3.5 w-3.5" />}
              {feedback}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCommit}
            disabled={
              !message.trim() ||
              status === "committing" ||
              status === "success" ||
              fileCount === 0
            }
          >
            {status === "committing" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            {status === "committing"
              ? "Pushing..."
              : status === "success"
                ? "Done"
                : "Commit & Push"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
