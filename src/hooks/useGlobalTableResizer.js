import { useEffect } from "react";

export function useGlobalTableResizer() {
  useEffect(() => {
    const setupTable = (table) => {
      if (!table) return;
      if (table.dataset.resizerInitialized === "true") {
        return;
      }

      // Check if this table has header elements in the first row
      const ths = table.querySelectorAll("thead tr:first-child th");
      if (ths.length === 0) return;

      // Mark it as initialized to prevent double-processing
      table.dataset.resizerInitialized = "true";
      table.classList.add("table-resizable");
      table.style.tableLayout = "fixed";

      // 1. Generate unique table key based on header text
      const generateTableKey = () => {
        const headers = Array.from(ths)
          .map(th => th.textContent.trim())
          .filter(Boolean);
        return "colWidths_" + (headers.join("_").replace(/[^\w]/g, "_") || "default");
      };

      const getColumnKey = (th, idx) => {
        const customKey = th.getAttribute("data-column-key") || th.getAttribute("data-id") || th.id;
        if (customKey) return customKey;
        const text = th.textContent || "";
        const clean = text
          .replace(/[^\w\s-]/g, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        return clean || `col_${idx}`;
      };

      const activeTableKey = generateTableKey();
      let widthsCache = {};

      const loadWidths = () => {
        try {
          const saved = localStorage.getItem(activeTableKey);
          if (saved) {
            widthsCache = JSON.parse(saved);
          }
        } catch (e) {
          console.error("Error reading column widths", e);
        }
      };

      const applyWidths = () => {
        if (Object.keys(widthsCache).length === 0) {
          loadWidths();
        }
        ths.forEach((th, idx) => {
          const colKey = getColumnKey(th, idx);
          const width = widthsCache[colKey];
          if (width) {
            th.style.width = `${width}px`;
            th.style.minWidth = `${width}px`;
            // Apply width to corresponding cells in table body
            const cells = table.querySelectorAll(`tbody tr td:nth-child(${idx + 1}), tfoot tr td:nth-child(${idx + 1})`);
            cells.forEach((cell) => {
              cell.style.width = `${width}px`;
              cell.style.minWidth = `${width}px`;
            });
          }
        });
      };

      const handleResizeStart = (e, idx, th) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = th.offsetWidth;
        const colKey = getColumnKey(th, idx);

        const handle = th.querySelector(".col-resize-handle");
        if (handle) {
          handle.classList.add("is-resizing");
        }

        // Lock all columns immediately when starting drag, using their current actual widths.
        const currentThs = table.querySelectorAll("thead tr:first-child th");
        currentThs.forEach((otherTh, otherIdx) => {
          const otherKey = getColumnKey(otherTh, otherIdx);
          const curWidth = otherTh.getBoundingClientRect().width || otherTh.offsetWidth;
          otherTh.style.width = `${curWidth}px`;
          otherTh.style.minWidth = `${curWidth}px`;
          widthsCache[otherKey] = curWidth;

          // Lock corresponding body cells too
          const cells = table.querySelectorAll(`tbody tr td:nth-child(${otherIdx + 1}), tfoot tr td:nth-child(${otherIdx + 1})`);
          cells.forEach((cell) => {
            cell.style.width = `${curWidth}px`;
            cell.style.minWidth = `${curWidth}px`;
          });
        });

        const onMouseMove = (ev) => {
          const diff = ev.clientX - startX;
          const newWidth = Math.max(60, startWidth + diff);

          // Directly modify the dragged column's DOM element width (high performance!)
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;

          const cells = table.querySelectorAll(`tbody tr td:nth-child(${idx + 1}), tfoot tr td:nth-child(${idx + 1})`);
          cells.forEach((cell) => {
            cell.style.width = `${newWidth}px`;
            cell.style.minWidth = `${newWidth}px`;
          });

          widthsCache[colKey] = newWidth;
        };

        const onMouseUp = () => {
          if (handle) {
            handle.classList.remove("is-resizing");
          }
          
          // Save the updated cache to localStorage *once* on drag end
          try {
            localStorage.setItem(activeTableKey, JSON.stringify(widthsCache));
          } catch (err) {
            console.error("Error saving column widths", err);
          }

          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      const injectHandles = () => {
        const currentThs = table.querySelectorAll("thead tr:first-child th");
        currentThs.forEach((th, idx) => {
          if (th.querySelector(".col-resize-handle")) return;

          th.style.position = "relative";

          const handle = document.createElement("div");
          handle.className = "col-resize-handle";

          const line = document.createElement("div");
          line.className = "col-resize-line";
          handle.appendChild(line);

          // Stop propagation of all mouse/pointer events to prevent triggering sorting/reordering
          const stopProp = (e) => {
            e.stopPropagation();
          };

          handle.addEventListener("mousedown", (e) => {
            stopProp(e);
            handleResizeStart(e, idx, th);
          });
          handle.addEventListener("pointerdown", stopProp);
          handle.addEventListener("mouseup", stopProp);
          handle.addEventListener("pointerup", stopProp);
          handle.addEventListener("click", (e) => {
            e.preventDefault();
            stopProp(e);
          });

          th.appendChild(handle);
        });
      };

      loadWidths();
      injectHandles();
      applyWidths();

      // Setup a sub-MutationObserver on the table to watch for content/header changes
      const tableObserver = new MutationObserver(() => {
        injectHandles();
        applyWidths();
      });
      tableObserver.observe(table, {
        childList: true,
        subtree: true
      });
    };

    // Scan initially for existing tables
    document.querySelectorAll("table").forEach(setupTable);

    // Watch for newly added tables in the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === "TABLE") {
                setupTable(node);
              } else {
                node.querySelectorAll("table").forEach(setupTable);
              }
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
