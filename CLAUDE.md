# Excalidraw Diagrams - Claude Guidelines

## File Format

Excalidraw files are JSON with `.excalidraw` extension. Key structure:

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [...],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Text Width Calculation

Text elements have a `width` property that must fit the content. Use these multipliers for Virgil font (fontFamily: 1):

| fontSize | px per character |
|----------|------------------|
| 12       | ~7px             |
| 14       | ~8px             |
| 16       | ~9px             |
| 20       | ~11px            |
| 36       | ~20px            |

**Formula:** `width = longestLineCharCount × pxPerChar + 10` (10px padding)

For multi-line text, find the longest line and calculate width based on that.

## Font Families

- `fontFamily: 1` - Virgil (hand-drawn, default)
- `fontFamily: 2` - Helvetica (clean)
- `fontFamily: 3` - Cascadia (monospace/code)

## Common Element Types

### Text
```json
{
  "id": "unique-id",
  "type": "text",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 30,
  "text": "Content here",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "left",
  "strokeColor": "#1e1e1e"
}
```

### Rectangle
```json
{
  "id": "unique-id",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "strokeColor": "#1971c2",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "roundness": { "type": 3 }
}
```

### Arrow
```json
{
  "id": "unique-id",
  "type": "arrow",
  "x": 100,
  "y": 100,
  "width": 70,
  "height": 0,
  "points": [[0, 0], [70, 0]],
  "strokeColor": "#1e1e1e",
  "strokeWidth": 2
}
```

### Diamond (for decision nodes)
```json
{
  "id": "unique-id",
  "type": "diamond",
  "x": 100,
  "y": 100,
  "width": 140,
  "height": 120,
  "strokeColor": "#f08c00",
  "backgroundColor": "#ffec99",
  "fillStyle": "solid"
}
```

## Color Palette (Excalidraw defaults)

| Color      | Stroke    | Background |
|------------|-----------|------------|
| Red        | #e03131   | #ffc9c9    |
| Blue       | #1971c2   | #a5d8ff    |
| Green      | #2f9e44   | #b2f2bb    |
| Yellow     | #f08c00   | #ffec99    |
| Purple     | #9c36b5   | #eebefa    |
| Gray       | #868e96   | #dee2e6    |
| Light Gray | #868e96   | #f8f9fa    |

## Best Practices

1. **Container boxes should be ~20px larger than text** on each side
2. **Text x/y should be offset ~10-15px** inside container boxes
3. **Arrow points are relative** to the arrow's x,y position
4. **Use consistent spacing** between elements (typically 50-70px gaps)
5. **Height calculation:** `lineCount × fontSize × 1.4` for line height

## Viewer

Run the viewer from `/viewer`:
```bash
pnpm dev
```

Diagram files are stored in `/viewer/diagrams/`.

- `⌘S` to save
- `⌘B` to toggle sidebar
- Supports dark/light mode
- Auto-saves after 2 seconds of inactivity
- Click `+` next to "Diagrams" to create new diagram
