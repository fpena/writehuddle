import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  parentId: string | null;
  createdAt: number;
}

interface TreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

async function ghFetch(path: string, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token || !repo) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN and GITHUB_REPO environment variables are required" },
        { status: 500 }
      );
    }

    const repoPath = `/repos/${repo}`;

    const tree = await ghFetch(
      `${repoPath}/git/trees/${branch}?recursive=1`,
      token
    );

    if (!tree?.tree) {
      return NextResponse.json({ files: [] });
    }

    const docsItems: TreeItem[] = tree.tree.filter(
      (item: TreeItem) => item.path.startsWith("docs/")
    );

    if (docsItems.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const folderIds = new Map<string, string>();
    const files: FileNode[] = [];

    const getFolderId = (folderPath: string): string => {
      const existing = folderIds.get(folderPath);
      if (existing) return existing;

      const id = nanoid(8);
      folderIds.set(folderPath, id);

      const parts = folderPath.split("/");
      const name = parts[parts.length - 1];
      const parentPath =
        parts.length > 1 ? parts.slice(0, -1).join("/") : null;

      files.push({
        id,
        name,
        type: "folder",
        parentId: parentPath ? getFolderId(parentPath) : null,
        createdAt: Date.now(),
      });

      return id;
    };

    const blobs = docsItems.filter((item) => item.type === "blob");

    const blobContents = await Promise.all(
      blobs.map(async (item) => {
        const blob = await ghFetch(
          `${repoPath}/git/blobs/${item.sha}`,
          token
        );
        const content = blob?.content
          ? Buffer.from(blob.content, "base64").toString("utf-8")
          : "";
        return { path: item.path, content };
      })
    );

    for (const { path, content } of blobContents) {
      const relativePath = path.replace(/^docs\//, "");
      const parts = relativePath.split("/");
      const fileName = parts[parts.length - 1];

      let parentId: string | null = null;
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join("/");
        parentId = getFolderId(parentPath);
      }

      files.push({
        id: nanoid(8),
        name: fileName,
        type: "file",
        content,
        parentId,
        createdAt: Date.now(),
      });
    }

    return NextResponse.json({ files });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch docs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
