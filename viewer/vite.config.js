import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Custom plugin to handle file saves
function excalidrawSavePlugin() {
  return {
    name: "excalidraw-save",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === "POST" && req.url === "/__save") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const { filename, content } = JSON.parse(body);
              // Only allow saving .excalidraw files in parent directory
              if (!filename.endsWith(".excalidraw")) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Invalid file type" }));
                return;
              }
              const filePath = path.resolve(__dirname, "diagrams", filename);
              // Ensure we're not writing outside the diagrams directory
              if (!filePath.startsWith(path.resolve(__dirname, "diagrams"))) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Invalid path" }));
                return;
              }
              fs.writeFileSync(filePath, content, "utf-8");
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), excalidrawSavePlugin()],
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  server: {
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  resolve: {
    alias: {
      "@diagrams": path.resolve(__dirname, ".."),
    },
  },
});
