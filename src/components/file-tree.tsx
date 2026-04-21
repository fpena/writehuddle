"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store, useStore, type FileNode } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function InlineRename({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (val: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <Input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value || initial)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value || initial);
        if (e.key === "Escape") onCancel();
      }}
      className="h-6 text-sm px-1 py-0 border-muted-foreground/30"
    />
  );
}

function TreeNode({
  node,
  depth,
  draggedId,
  onDragStart,
  onDrop,
}: {
  node: FileNode;
  depth: number;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (targetId: string | null) => void;
}) {
  const { activeFileId, expandedFolders, files } = useStore();
  const [renaming, setRenaming] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isFolder = node.type === "folder";
  const isExpanded = expandedFolders.includes(node.id);
  const isActive = activeFileId === node.id;
  const children = files
    .filter((f) => f.parentId === node.id)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const handleClick = () => {
    if (isFolder) {
      store.toggleFolder(node.id);
    } else {
      store.setActive(node.id);
    }
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-1 px-2 py-1 text-sm cursor-pointer rounded-sm transition-colors",
              isActive && !isFolder && "bg-accent text-accent-foreground",
              !isActive && "hover:bg-accent/50",
              dragOver && "bg-accent/70 ring-1 ring-primary/30"
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={handleClick}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart(node.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (isFolder && draggedId !== node.id) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              if (isFolder) onDrop(node.id);
            }}
          >
            {isFolder && (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
            {!isFolder && <span className="w-3.5" />}

            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}

            {renaming ? (
              <InlineRename
                initial={node.name}
                onCommit={(val) => {
                  store.rename(node.id, val);
                  setRenaming(false);
                }}
                onCancel={() => setRenaming(false)}
              />
            ) : (
              <span className="truncate flex-1">{node.name}</span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 ml-auto"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setRenaming(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                {isFolder && (
                  <>
                    <DropdownMenuItem
                      onClick={() => store.createFile(node.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => store.createFolder(node.id)}
                    >
                      <FolderPlus className="h-3.5 w-3.5 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => store.deleteNode(node.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem onClick={() => setRenaming(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Rename
          </ContextMenuItem>
          {isFolder && (
            <>
              <ContextMenuItem onClick={() => store.createFile(node.id)}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => store.createFolder(node.id)}>
                <FolderPlus className="h-3.5 w-3.5 mr-2" />
                New Folder
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive"
            onClick={() => store.deleteNode(node.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const { files } = useStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const rootNodes = files
    .filter((f) => f.parentId === null)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const handleDrop = (targetId: string | null) => {
    if (draggedId) {
      store.moveFile(draggedId, targetId);
      setDraggedId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => store.createFile(null)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => store.createFolder(null)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto py-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(null);
        }}
      >
        {rootNodes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No files yet</p>
            <button
              onClick={() => store.createFile(null)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Create your first file
            </button>
          </div>
        ) : (
          rootNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              draggedId={draggedId}
              onDragStart={setDraggedId}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </div>
  );
}
