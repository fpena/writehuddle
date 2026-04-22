import { NextRequest, NextResponse } from "next/server";
import { simpleGit } from "simple-git";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  parentId: string | null;
}

const DOCS_DIR = join(process.cwd(), "docs");

function buildDirParts(node: FileNode, files: FileNode[]): string[] {
  const parts: string[] = [node.name];
  let current = node;
  while (current.parentId) {
    const parent = files.find((f) => f.id === current.parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  return parts;
}

function buildPath(node: FileNode, files: FileNode[]): string {
  const parts = buildDirParts(node, files);
  if (node.type === "file" && !node.name.includes(".")) {
    parts[parts.length - 1] = `${node.name}.md`;
  }
  return join(DOCS_DIR, ...parts);
}

export async function POST(req: NextRequest) {
  try {
    const { files, message } = (await req.json()) as {
      files: FileNode[];
      message: string;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Commit message is required" },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files to commit" },
        { status: 400 }
      );
    }

    await rm(DOCS_DIR, { recursive: true, force: true });
    await mkdir(DOCS_DIR, { recursive: true });

    for (const folder of files.filter((f) => f.type === "folder")) {
      await mkdir(buildPath(folder, files), { recursive: true });
    }

    for (const file of files.filter((f) => f.type === "file")) {
      const filePath = buildPath(file, files);
      await mkdir(join(filePath, ".."), { recursive: true });
      await writeFile(filePath, file.content || "");
    }

    const git = simpleGit(process.cwd());

    await git.add("docs/");

    const status = await git.status();
    const hasChanges =
      status.staged.length > 0 ||
      status.deleted.length > 0 ||
      status.created.length > 0;

    if (!hasChanges) {
      return NextResponse.json({
        success: true,
        message: "No changes to commit",
      });
    }

    await git.commit(message.trim());
    await git.push();

    return NextResponse.json({ success: true, message: "Committed and pushed" });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to commit and push";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
