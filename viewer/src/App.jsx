import React, { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Check,
  Sun,
  Moon,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";

// Import all .excalidraw files from diagrams subdirectory
const diagramModules = import.meta.glob("../diagrams/*.excalidraw", {
  eager: false,
  query: "?raw",
  import: "default",
});

// Hash elements for change detection (ignores transient properties)
const hashElements = (elements) => {
  if (!elements) return "";
  return JSON.stringify(
    elements.map((el) => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      text: el.text,
      points: el.points,
      strokeColor: el.strokeColor,
      backgroundColor: el.backgroundColor,
      fillStyle: el.fillStyle,
      strokeWidth: el.strokeWidth,
      roughness: el.roughness,
      opacity: el.opacity,
      groupIds: el.groupIds,
      boundElements: el.boundElements,
      startBinding: el.startBinding,
      endBinding: el.endBinding,
    }))
  );
};

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [diagramData, setDiagramData] = useState(null);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("excalidraw-viewer-sidebar");
    return saved !== "false";
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("excalidraw-viewer-theme");
    return saved ? saved === "dark" : true;
  });

  const excalidrawRef = useRef(null);
  const excalidrawAPIRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedHashRef = useRef(null);

  // Process available files on mount
  useEffect(() => {
    const fileList = Object.keys(diagramModules).map((path) => {
      const name = path.replace("../diagrams/", "").replace(".excalidraw", "");
      const filename = path.replace("../diagrams/", "");
      return { path, name, filename };
    });
    setFiles(fileList);

    if (fileList.length > 0) {
      setSelectedFile(fileList[0]);
    }
  }, []);

  // Load diagram data when selection changes
  const loadDiagram = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const loader = diagramModules[selectedFile.path];
      if (loader) {
        const rawContent = await loader();
        const data = JSON.parse(rawContent);
        setDiagramData(data);
        setError(null);
        setHasUnsavedChanges(false);
        setSaveStatus(null);
        lastSavedHashRef.current = hashElements(data.elements);
      }
    } catch (err) {
      setError(`Failed to parse: ${err.message}`);
      setDiagramData(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    loadDiagram();
  }, [loadDiagram]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("excalidraw-viewer-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("excalidraw-viewer-sidebar", sidebarOpen ? "true" : "false");
  }, [sidebarOpen]);

  // Update theme without remounting
  useEffect(() => {
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        appState: { theme: darkMode ? "dark" : "light" },
      });
    }
  }, [darkMode]);

  // Save function
  const saveFile = useCallback(async () => {
    if (!selectedFile || !excalidrawAPIRef.current) return;

    const elements = excalidrawAPIRef.current.getSceneElements();
    const appState = excalidrawAPIRef.current.getAppState();

    const content = JSON.stringify(
      {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      },
      null,
      2
    );

    setSaveStatus("saving");

    try {
      const response = await fetch("/__save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.filename,
          content: content + "\n",
        }),
      });

      if (response.ok) {
        setSaveStatus("saved");
        lastSavedHashRef.current = hashElements(elements);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setSaveStatus("error");
      console.error("Save failed:", err);
    }
  }, [selectedFile]);

  // Auto-save with debounce
  const handleChange = useCallback(
    (elements, appState) => {
      if (!diagramData) return;

      // Check if elements actually changed (not just cursor/selection)
      const currentHash = hashElements(elements);
      const hasChanges = currentHash !== lastSavedHashRef.current;

      if (!hasChanges) return;

      // Safety: don't save empty over non-empty (protects against race conditions)
      if (elements.length === 0 && lastSavedHashRef.current !== "") {
        return;
      }

      setHasUnsavedChanges(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveFile();
      }, 2000);
    },
    [diagramData, saveFile]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveFile]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Create new diagram
  const createNewDiagram = useCallback(async () => {
    const name = prompt("Enter diagram name:");
    if (!name) return;

    const filename = `${name}.excalidraw`;
    const content = JSON.stringify(
      {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          gridSize: null,
        },
      },
      null,
      2
    );

    try {
      const response = await fetch("/__save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: content + "\n" }),
      });

      if (response.ok) {
        // Reload the page to pick up the new file
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Failed to create: ${data.error}`);
      }
    } catch (err) {
      alert(`Failed to create: ${err.message}`);
    }
  }, []);

  const theme = darkMode ? themes.dark : themes.light;

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg }}>
      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          backgroundColor: theme.sidebarBg,
          borderColor: theme.border,
          width: sidebarOpen ? "280px" : "48px",
          padding: sidebarOpen ? "16px" : "12px 8px",
        }}
      >
        <div style={{ ...styles.header, justifyContent: sidebarOpen ? "space-between" : "center" }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ ...styles.title, color: theme.text }}>Diagrams</h2>
              <button
                onClick={createNewDiagram}
                style={{ ...styles.iconButton, color: theme.textMuted }}
                title="Create new diagram"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ ...styles.iconButton, color: theme.textMuted }}
            title={sidebarOpen ? "Collapse sidebar (⌘B)" : "Expand sidebar (⌘B)"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {sidebarOpen && (
          <>
            <div style={styles.fileList}>
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (confirm("You have unsaved changes. Switch anyway?")) {
                        setSelectedFile(file);
                      }
                    } else {
                      setSelectedFile(file);
                    }
                  }}
                  style={{
                    ...styles.fileButton,
                    color: theme.textMuted,
                    ...(selectedFile?.path === file.path
                      ? { ...styles.fileButtonActive, backgroundColor: theme.accent }
                      : {}),
                  }}
                >
                  {file.name}
                </button>
              ))}
            </div>

            {files.length === 0 && (
              <p style={{ ...styles.noFiles, color: theme.textMuted }}>
                No .excalidraw files found
              </p>
            )}

            <div style={{ ...styles.footer, borderColor: theme.border }}>
              <div style={styles.controls}>
                <button
                  onClick={saveFile}
                  style={{
                    ...styles.iconButton,
                    color: hasUnsavedChanges ? theme.accent : theme.textMuted,
                  }}
                  title="Save (⌘S)"
                >
                  {saveStatus === "saving" ? (
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  ) : saveStatus === "saved" ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  style={{ ...styles.iconButton, color: theme.textMuted }}
                  title={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  style={{ ...styles.iconButton, color: showHelp ? theme.accent : theme.textMuted }}
                  title="Help"
                >
                  <HelpCircle size={18} />
                </button>
              </div>
              {showHelp && (
                <div style={{ ...styles.helpBox, backgroundColor: theme.border, color: theme.text }}>
                  <div style={styles.helpItem}>
                    <kbd style={{ ...styles.kbd, backgroundColor: theme.sidebarBg }}>Space</kbd>
                    <span>+ drag to pan</span>
                  </div>
                  <div style={styles.helpItem}>
                    <kbd style={{ ...styles.kbd, backgroundColor: theme.sidebarBg }}>⌘</kbd>
                    <span>+ scroll to zoom</span>
                  </div>
                  <div style={styles.helpItem}>
                    <kbd style={{ ...styles.kbd, backgroundColor: theme.sidebarBg }}>⌘S</kbd>
                    <span>to save</span>
                  </div>
                  <div style={styles.helpItem}>
                    <kbd style={{ ...styles.kbd, backgroundColor: theme.sidebarBg }}>⌘B</kbd>
                    <span>toggle sidebar</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main editor */}
      <div style={{ ...styles.viewer, backgroundColor: theme.canvasBg }}>
        {error && (
          <div style={{ ...styles.error, backgroundColor: theme.errorBg, color: theme.errorText }}>
            {error}
          </div>
        )}
        {diagramData && (
          <Excalidraw
            key={selectedFile?.path}
            excalidrawAPI={(api) => {
              excalidrawAPIRef.current = api;
            }}
            initialData={{
              elements: diagramData.elements || [],
              appState: {
                ...diagramData.appState,
                theme: darkMode ? "dark" : "light",
              },
              scrollToContent: !diagramData.appState?.scrollX,
            }}
            theme={darkMode ? "dark" : "light"}
            onChange={handleChange}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
              },
            }}
          />
        )}
        {!diagramData && !error && (
          <div style={{ ...styles.placeholder, color: theme.textMuted }}>
            Select a diagram to edit
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const themes = {
  dark: {
    bg: "#0d0d0d",
    sidebarBg: "#161616",
    canvasBg: "#1e1e1e",
    text: "#e5e5e5",
    textMuted: "#888",
    border: "#2a2a2a",
    accent: "#3b82f6",
    errorBg: "#3b1818",
    errorText: "#f87171",
  },
  light: {
    bg: "#f5f5f5",
    sidebarBg: "#ffffff",
    canvasBg: "#ffffff",
    text: "#1a1a1a",
    textMuted: "#666",
    border: "#e5e5e5",
    accent: "#3b82f6",
    errorBg: "#fef2f2",
    errorText: "#dc2626",
  },
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid",
    transition: "width 0.15s ease, padding 0.15s ease",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    minHeight: "24px",
  },
  title: {
    fontSize: "15px",
    fontWeight: "600",
    margin: 0,
    whiteSpace: "nowrap",
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s ease",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    overflowY: "auto",
  },
  fileButton: {
    padding: "8px 10px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileButtonActive: {
    color: "#fff",
  },
  noFiles: {
    fontSize: "12px",
    textAlign: "center",
    padding: "20px",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid",
  },
  controls: {
    display: "flex",
    gap: "4px",
    justifyContent: "center",
  },
  helpBox: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "11px",
  },
  helpItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  },
  kbd: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontFamily: "inherit",
  },
  viewer: {
    flex: 1,
    position: "relative",
  },
  error: {
    padding: "16px 20px",
    fontSize: "13px",
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    fontSize: "14px",
  },
};

export default App;
