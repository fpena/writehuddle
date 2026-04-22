"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Eye,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveFile, useStore, type FileNode } from "@/lib/store";
import { FileTree } from "@/components/file-tree";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import { CommitDialog } from "@/components/commit-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [syncing, setSyncing] = useState(false);
  const file = useActiveFile();
  const { files, replaceFiles } = useStore();

  const syncFromGitHub = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/git/docs");
      const data = await res.json();
      if (res.ok && data.files?.length > 0) {
        replaceFiles(data.files as FileNode[]);
      }
    } catch {
      // silent fail on sync
    } finally {
      setSyncing(false);
    }
  }, [replaceFiles]);

  useEffect(() => {
    if (files.length === 0) {
      syncFromGitHub();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const breadcrumb = (() => {
    if (!file) return null;
    const parts: string[] = [file.name];
    let current = file;
    while (current.parentId) {
      const parent = files.find((f) => f.id === current.parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    return parts;
  })();

  return (
    <TooltipProvider delay={300}>
      <div className="h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="h-11 border-b flex items-center px-2 gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            </TooltipContent>
          </Tooltip>

          {breadcrumb && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground ml-1">
              {breadcrumb.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground/50">/</span>}
                  <span
                    className={cn(
                      i === breadcrumb.length - 1 && "text-foreground"
                    )}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                onClick={syncFromGitHub}
                disabled={syncing}
                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("h-4 w-4", syncing && "animate-spin")}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Sync from GitHub</TooltipContent>
            </Tooltip>
            <CommitDialog />
            <div className="flex items-center rounded-md border p-0.5">
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setMode("write")}
                  className={cn(
                    "p-1 rounded-sm transition-colors",
                    mode === "write"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Write</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setMode("preview")}
                  className={cn(
                    "p-1 rounded-sm transition-colors",
                    mode === "preview"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Preview</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside
            className={cn(
              "border-r bg-muted/30 transition-all duration-200 overflow-hidden shrink-0",
              sidebarOpen ? "w-60" : "w-0"
            )}
          >
            <FileTree />
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {mode === "write" ? <Editor /> : <Preview />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
