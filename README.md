# Excalidraw Viewer

A minimal local viewer/editor for `.excalidraw` files. Edit diagrams visually or let Claude edit the JSON directly.

## Setup

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173

## How it works

- Diagrams are stored in the `diagrams/` folder
- Click a diagram name in the sidebar to view/edit it
- Click `+` to create a new diagram
- Auto-saves after 2 seconds of inactivity
- `Cmd+S` to save immediately
- `Cmd+B` to toggle sidebar

## Claude Integration

Claude can create and edit `.excalidraw` files directly by writing JSON. See `CLAUDE.md` for element specs and text width calculations.
