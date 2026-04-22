"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "@tiptap/markdown";
import { store, useActiveFile } from "@/lib/store";
import { EditorToolbar } from "@/components/editor-toolbar";

export function Editor() {
  const file = useActiveFile();
  const prevFileId = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "code-block" } },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Highlight,
      Typography,
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-full px-8 py-6 lg:px-16 lg:py-10 font-[var(--font-lora)] text-lg leading-relaxed",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (file) {
        const md = editor.storage.markdown?.manager?.serialize(editor.getJSON()) ?? "";
        store.updateContent(file.id, md);
      }
    },
  });

  useEffect(() => {
    if (!editor || !file) return;
    if (prevFileId.current !== file.id) {
      editor.commands.setContent(file.content || "", {
        contentType: "markdown",
      });
      prevFileId.current = file.id;
    }
  }, [editor, file]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">No file selected</p>
          <p className="text-sm">Create or select a file to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
