"use client";

import { useActiveFile } from "@/lib/store";

export function Preview() {
  const file = useActiveFile();

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">No file selected</p>
          <p className="text-sm">Create or select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="prose prose-neutral dark:prose-invert max-w-none px-8 py-6 lg:px-16 lg:py-10 font-[var(--font-lora)] text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: file.content || "" }}
      />
    </div>
  );
}
