# WriteHuddle

A minimal, distraction-free markdown writing app built with Next.js. Write, organize, and preview your documents — all in the browser.

## Features

- **Rich-text editor** — Powered by TipTap with a formatting toolbar (headings, bold, italic, lists, code blocks, blockquotes, highlights, and more)
- **Live preview** — Toggle between writing and preview modes to see your rendered content instantly
- **File & folder management** — Create, rename, delete, and drag-and-drop files into folders to keep your writing organized
- **Elegant typography** — Lora serif font for the writing area, tuned for comfortable long-form reading and writing
- **Persistent storage** — All files are saved to localStorage automatically so your work survives page reloads
- **Collapsible sidebar** — Hide the file tree for a focused, distraction-free writing experience
- **Context menus** — Right-click any file or folder for quick actions
- **Keyboard shortcuts** — Standard formatting shortcuts (⌘B, ⌘I, ⌘E, ⌘Z, etc.)

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [TipTap](https://tiptap.dev) (rich-text editor)
- [shadcn/ui](https://ui.shadcn.com) (UI components)
- [Tailwind CSS](https://tailwindcss.com) (styling)
- [Zustand](https://zustand.docs.pmnd.rs) (state management)
- [Lucide](https://lucide.dev) (icons)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start writing.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page with sidebar + editor
│   └── globals.css         # Global styles and TipTap overrides
├── components/
│   ├── editor.tsx          # TipTap editor wrapper
│   ├── editor-toolbar.tsx  # Formatting toolbar
│   ├── file-tree.tsx       # Sidebar file/folder tree
│   ├── preview.tsx         # HTML preview pane
│   └── ui/                 # shadcn/ui primitives
└── lib/
    ├── store.ts            # Zustand store with localStorage persistence
    └── utils.ts            # Utility helpers
```

## License

MIT
