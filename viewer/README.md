# Excalidraw Viewer

A minimal local viewer for `.excalidraw` files. View-only mode - edit the JSON files directly with your editor or Claude.

## Usage

```bash
cd viewer
pnpm dev
```

Then open http://localhost:5173

## How it works

- Automatically detects all `.excalidraw` files in the parent directory
- Click a diagram name in the sidebar to view it
- Edit the JSON file and save - Vite hot-reloads the changes
- View-only mode: pan and zoom work, but no editing UI

## Adding diagrams

Just create a new `.excalidraw` file in `/Users/mac_daddy/Code/excalidraw/` with valid Excalidraw JSON format.
