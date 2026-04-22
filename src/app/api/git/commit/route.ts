import { NextRequest, NextResponse } from "next/server";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  parentId: string | null;
}

function buildFilePath(node: FileNode, files: FileNode[]): string {
  const parts: string[] = [node.name];
  let current = node;
  while (current.parentId) {
    const parent = files.find((f) => f.id === current.parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  if (node.type === "file" && !node.name.includes(".")) {
    parts[parts.length - 1] = `${node.name}.md`;
  }
  return `docs/${parts.join("/")}`;
}

async function ghFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json();
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

    const ref = await ghFetch(
      `${repoPath}/git/ref/heads/${branch}`,
      token
    );
    const latestCommitSha: string = ref.object.sha;

    const commit = await ghFetch(
      `${repoPath}/git/commits/${latestCommitSha}`,
      token
    );
    const baseTreeSha: string = commit.tree.sha;

    const treeItems = files
      .filter((f) => f.type === "file")
      .map((f) => ({
        path: buildFilePath(f, files),
        mode: "100644" as const,
        type: "blob" as const,
        content: f.content || "",
      }));

    if (treeItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No files to commit",
      });
    }

    const newTree = await ghFetch(`${repoPath}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (newTree.sha === baseTreeSha) {
      return NextResponse.json({
        success: true,
        message: "No changes to commit",
      });
    }

    const newCommit = await ghFetch(`${repoPath}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify({
        message: message.trim(),
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    await ghFetch(`${repoPath}/git/refs/heads/${branch}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return NextResponse.json({
      success: true,
      message: "Committed and pushed",
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to commit and push";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
