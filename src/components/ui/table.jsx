import * as React from "react";
import { cn } from "./utils.js";

const Table = React.forwardRef(({ className, containerClassName, tableKey, ...props }, ref) => {
  const localRef = React.useRef(null);
  const tableRef = ref || localRef;

  React.useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    // Helper to generate unique table key based on header names to persist in localStorage
    const generateTableKey = () => {
      const headers = Array.from(tableEl.querySelectorAll("thead tr:first-child th"))
        .map(th => th.textContent.trim())
        .filter(Boolean);
      return "colWidths_" + (headers.join("_").replace(/[^\w]/g, "_") || "default");
    };

    // Helper to resolve unique column key
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

    let activeTableKey = tableKey || tableEl.getAttribute("data-table-key");
    let widthsCache = {};

    const loadWidths = () => {
      if (!activeTableKey) {
        activeTableKey = generateTableKey();
      }
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

      tableEl.style.tableLayout = "fixed";

      const ths = tableEl.querySelectorAll("thead tr:first-child th");
      ths.forEach((th, idx) => {
        const colKey = getColumnKey(th, idx);
        const width = widthsCache[colKey];
        if (width) {
          th.style.width = `${width}px`;
          th.style.minWidth = `${width}px`;
          // Apply width to corresponding cells in table body
          const cells = tableEl.querySelectorAll(`tbody tr td:nth-child(${idx + 1}), tfoot tr td:nth-child(${idx + 1})`);
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
      // This is crucial to prevent shifting of other columns!
      const ths = tableEl.querySelectorAll("thead tr:first-child th");
      ths.forEach((otherTh, otherIdx) => {
        const otherKey = getColumnKey(otherTh, otherIdx);
        const curWidth = otherTh.getBoundingClientRect().width || otherTh.offsetWidth;
        otherTh.style.width = `${curWidth}px`;
        otherTh.style.minWidth = `${curWidth}px`;
        widthsCache[otherKey] = curWidth;

        // Lock corresponding body cells too
        const cells = tableEl.querySelectorAll(`tbody tr td:nth-child(${otherIdx + 1}), tfoot tr td:nth-child(${otherIdx + 1})`);
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

        const cells = tableEl.querySelectorAll(`tbody tr td:nth-child(${idx + 1}), tfoot tr td:nth-child(${idx + 1})`);
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
          if (!activeTableKey) activeTableKey = generateTableKey();
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
      const ths = tableEl.querySelectorAll("thead tr:first-child th");
      ths.forEach((th, idx) => {
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

    // Load and apply initially
    loadWidths();
    injectHandles();
    applyWidths();

    // Use MutationObserver to inject handles and apply widths when React updates the DOM
    const observer = new MutationObserver((mutations) => {
      let hasHeaderChanges = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          hasHeaderChanges = true;
          break;
        }
      }
      if (hasHeaderChanges) {
        injectHandles();
        applyWidths();
      }
    });

    observer.observe(tableEl, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [tableKey]);

  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        ref={tableRef}
        data-slot="table"
        className={cn("w-full caption-bottom text-sm table-resizable", className)}
        {...props}
      />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    data-slot="table-header"
    className={cn("[&_tr]:border-b", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    data-slot="table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    data-slot="table-footer"
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    data-slot="table-row"
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    data-slot="table-head"
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    data-slot="table-cell"
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    data-slot="table-caption"
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
