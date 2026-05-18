"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";

import { cn } from "./utils.js";

const SelectContext = React.createContext(null);
const MAX_VISIBLE_OPTIONS = 80;

const normalizeSearch = (value) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

function textFromChildren(children) {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join(" ").trim();
  if (React.isValidElement(children)) return textFromChildren(children.props.children);
  return "";
}

function collectItems(children, items = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === SelectItem) {
      items.push({
        value: String(child.props.value ?? ""),
        label: textFromChildren(child.props.children) || String(child.props.value ?? ""),
        disabled: child.props.disabled,
      });
      return;
    }

    if (child.props?.children) {
      collectItems(child.props.children, items);
    }
  });
  return items;
}

function findPlaceholder(children) {
  let placeholder = "";
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || placeholder) return;
    if (child.type === SelectValue) {
      placeholder = child.props.placeholder || textFromChildren(child.props.children);
    } else if (child.props?.children) {
      placeholder = findPlaceholder(child.props.children);
    }
  });
  return placeholder;
}

function Select({
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  children,
  loading = false,
  error = "",
  allowCreate = false,
  onCreate,
  creating = false,
  createLabel,
  clearable = false,
  maxVisibleOptions = MAX_VISIBLE_OPTIONS,
  className,
  ...props
}) {
  const rootRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedValue = value ?? internalValue;
  const items = React.useMemo(() => {
    const seen = new Set();
    return collectItems(children).filter((item) => {
      if (!item.value || seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [children]);

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === String(selectedValue ?? "")),
    [items, selectedValue],
  );

  const filteredItems = React.useMemo(() => {
    const term = normalizeSearch(query);
    const source = term
      ? items.filter((item) => normalizeSearch(item.label).includes(term))
      : items;
    return source.slice(0, maxVisibleOptions);
  }, [items, maxVisibleOptions, query]);

  const exactMatch = React.useMemo(() => {
    const term = normalizeSearch(query);
    return !!term && items.some((item) => normalizeSearch(item.label) === term);
  }, [items, query]);

  const canCreate = allowCreate
    && typeof onCreate === "function"
    && !!query.trim()
    && !exactMatch
    && !loading
    && !error
    && !creating;

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const commitValue = React.useCallback((nextValue) => {
    if (disabled) return;
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    setQuery("");
  }, [disabled, onValueChange, value]);

  const handleCreate = React.useCallback(async () => {
    if (!canCreate) return;
    const created = await onCreate(query.trim());
    if (created == null) return;
    const nextValue = typeof created === "object" ? created.value : created;
    if (nextValue != null && nextValue !== "") commitValue(String(nextValue));
  }, [canCreate, commitValue, onCreate, query]);

  const handleKeyDown = React.useCallback((event) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredItems.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      const active = filteredItems[activeIndex];
      if (active && !active.disabled) {
        commitValue(active.value);
      } else if (canCreate) {
        handleCreate();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }, [activeIndex, canCreate, commitValue, disabled, filteredItems, handleCreate, open]);

  const clearValue = React.useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    commitValue("");
    inputRef.current?.focus();
  }, [commitValue]);

  const contextValue = React.useMemo(() => ({
    activeIndex,
    canCreate,
    clearValue,
    clearable,
    commitValue,
    createLabel,
    creating,
    disabled,
    error,
    filteredItems,
    handleCreate,
    handleKeyDown,
    inputRef,
    loading,
    open,
    query,
    selectedItem,
    selectedValue,
    setOpen,
    setQuery,
  }), [
    activeIndex,
    canCreate,
    clearValue,
    clearable,
    commitValue,
    createLabel,
    creating,
    disabled,
    error,
    filteredItems,
    handleCreate,
    handleKeyDown,
    loading,
    open,
    query,
    selectedItem,
    selectedValue,
  ]);

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={rootRef} data-slot="select" className={cn("relative w-full", className)} style={{ zIndex: open ? 100 : 'auto' }} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function useSelectContext(component) {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error(`${component} must be used within Select`);
  }
  return context;
}

function SelectGroup({ children }) {
  return <>{children}</>;
}

function SelectValue() {
  return null;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  const context = useSelectContext("SelectTrigger");
  const placeholder = findPlaceholder(children) || "Select";
  const displayValue = context.open ? context.query : (context.selectedItem?.label || "");

  return (
    <div
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm transition-[color,box-shadow] focus-within:ring-[3px] data-[size=default]:h-9 data-[size=sm]:h-8",
        context.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => {
        if (!context.disabled) {
          context.setOpen(true);
          context.inputRef.current?.focus();
        }
      }}
      {...props}
    >
      <input
        ref={context.inputRef}
        type="text"
        disabled={context.disabled}
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => {
          context.setQuery("");
          context.setOpen(true);
        }}
        onChange={(event) => {
          context.setQuery(event.target.value);
          context.setOpen(true);
        }}
        onKeyDown={context.handleKeyDown}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        autoComplete="off"
      />
      {context.loading || context.creating ? (
        <Loader2Icon className="size-4 shrink-0 animate-spin opacity-60" />
      ) : context.clearable && context.selectedValue ? (
        <button
          type="button"
          onClick={context.clearValue}
          className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear selection"
        >
          <XIcon className="size-4" />
        </button>
      ) : (
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      )}
    </div>
  );
}

function SelectContent({ className }) {
  const context = useSelectContext("SelectContent");
  if (!context.open) return null;

  return (
    <div
      data-slot="select-content"
      className={cn(
        "absolute left-0 top-full mt-1 w-full min-w-[8rem] max-h-[220px] overflow-y-auto overflow-x-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-xl z-[9999] scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400",
        className,
      )}
    >
      {context.loading && (
        <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading...
        </div>
      )}

      {!context.loading && context.error && (
        <div className="px-2 py-2 text-sm text-red-600">Unable to load options</div>
      )}

      {!context.loading && !context.error && context.filteredItems.map((item, index) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => context.commitValue(item.value)}
          className={cn(
            "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
            index === context.activeIndex && "bg-accent text-accent-foreground",
          )}
        >
          <span className="min-w-0 truncate">{item.label}</span>
          {item.value === String(context.selectedValue ?? "") && <CheckIcon className="size-4 shrink-0" />}
        </button>
      ))}

      {!context.loading && !context.error && context.filteredItems.length === 0 && !context.canCreate && (
        <div className="px-2 py-2 text-sm text-muted-foreground">No results found</div>
      )}

      {!context.loading && !context.error && context.canCreate && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={context.handleCreate}
          disabled={context.creating}
          className="mt-1 flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50"
        >
          <span>{context.createLabel?.(context.query.trim()) || `Create "${context.query.trim()}"`}</span>
          {context.creating && <Loader2Icon className="size-4 animate-spin" />}
        </button>
      )}
    </div>
  );
}

function SelectLabel({ className, ...props }) {
  return <div data-slot="select-label" className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)} {...props} />;
}

function SelectItem() {
  return null;
}

function SelectSeparator({ className, ...props }) {
  return <div data-slot="select-separator" className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)} {...props} />;
}

function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

function SearchableSelect({
  options = [],
  value,
  onValueChange,
  placeholder,
  className,
  triggerClassName,
  contentClassName,
  disabled,
  loading,
  error,
  allowCreate,
  onCreate,
  creating,
  createLabel,
  clearable,
  maxVisibleOptions,
  validationError,
}) {
  return (
    <Select
      value={value == null ? "" : String(value)}
      onValueChange={onValueChange}
      disabled={disabled}
      loading={loading}
      error={error}
      allowCreate={allowCreate}
      onCreate={onCreate}
      creating={creating}
      createLabel={createLabel}
      clearable={clearable}
      maxVisibleOptions={maxVisibleOptions}
      className={className}
    >
      <SelectTrigger className={triggerClassName} aria-invalid={!!validationError}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export {
  SearchableSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
