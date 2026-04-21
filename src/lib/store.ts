import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  parentId: string | null;
  createdAt: number;
}

interface FileState {
  files: FileNode[];
  activeFileId: string | null;
  expandedFolders: string[];

  createFile: (parentId: string | null, name?: string) => string;
  createFolder: (parentId: string | null, name?: string) => string;
  rename: (id: string, name: string) => void;
  updateContent: (id: string, content: string) => void;
  setActive: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  moveFile: (fileId: string, targetFolderId: string | null) => void;
  deleteNode: (id: string) => void;
}

export const useStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,
      expandedFolders: [],

      createFile(parentId, name) {
        const id = nanoid(8);
        set((s) => ({
          files: [
            ...s.files,
            {
              id,
              name: name ?? "Untitled",
              type: "file" as const,
              content: "",
              parentId,
              createdAt: Date.now(),
            },
          ],
          activeFileId: id,
        }));
        return id;
      },

      createFolder(parentId, name) {
        const id = nanoid(8);
        set((s) => ({
          files: [
            ...s.files,
            {
              id,
              name: name ?? "New Folder",
              type: "folder" as const,
              parentId,
              createdAt: Date.now(),
            },
          ],
          expandedFolders: [...s.expandedFolders, id],
        }));
        return id;
      },

      rename(id, name) {
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
      },

      updateContent(id, content) {
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, content } : f)),
        }));
      },

      setActive(id) {
        set({ activeFileId: id });
      },

      toggleFolder(id) {
        set((s) => {
          const has = s.expandedFolders.includes(id);
          return {
            expandedFolders: has
              ? s.expandedFolders.filter((fid) => fid !== id)
              : [...s.expandedFolders, id],
          };
        });
      },

      moveFile(fileId, targetFolderId) {
        if (fileId === targetFolderId) return;
        const { files } = get();
        const isDescendant = (parentId: string, childId: string): boolean => {
          const children = files.filter((f) => f.parentId === parentId);
          return children.some(
            (c) =>
              c.id === childId ||
              (c.type === "folder" && isDescendant(c.id, childId))
          );
        };
        if (targetFolderId && isDescendant(fileId, targetFolderId)) return;

        set((s) => ({
          files: s.files.map((f) =>
            f.id === fileId ? { ...f, parentId: targetFolderId } : f
          ),
        }));
      },

      deleteNode(id) {
        const { files } = get();
        const collectIds = (nodeId: string): string[] => {
          const children = files.filter((f) => f.parentId === nodeId);
          return [nodeId, ...children.flatMap((c) => collectIds(c.id))];
        };
        const toDelete = new Set(collectIds(id));

        set((s) => ({
          files: s.files.filter((f) => !toDelete.has(f.id)),
          activeFileId: toDelete.has(s.activeFileId ?? "")
            ? null
            : s.activeFileId,
        }));
      },
    }),
    {
      name: "writehuddle-files",
    }
  )
);

export const store = useStore.getState();

export function useActiveFile(): FileNode | null {
  const files = useStore((s) => s.files);
  const activeFileId = useStore((s) => s.activeFileId);
  return files.find((f) => f.id === activeFileId) ?? null;
}
