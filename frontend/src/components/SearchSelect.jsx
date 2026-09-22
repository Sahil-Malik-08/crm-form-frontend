import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * SearchSelect — a searchable single-select dropdown that follows the app's
 * form styling (CSS variables, grid layout) so it can be dropped into any form.
 */
function SearchSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  required = false,
  label,
  style,
  onSearch,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value).toLowerCase() === String(value).toLowerCase());
  const filtered = options.filter((o) =>
    String(o.label || "")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Infinite scroll: load more when scrolling near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el || !onLoadMore) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && hasMore && !loadingMore) {
        onLoadMore?.();
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  const inputBase = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    font: "inherit",
    fontSize: 13,
    background: "var(--color-surface-card)",
    color: "var(--color-text-primary)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "block", ...(style || {}) }}>
      {label && (
        <label style={{ display: "block", textTransform: "capitalize", fontSize: 12.5, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          {label}
          {required && <span className="required-marker" aria-label="required"> *</span>}
        </label>
      )}
      <div ref={rootRef} style={{ position: "relative" }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const nextOpen = !open;
            setOpen(nextOpen);
            setQuery("");
            if (nextOpen) {
              onSearch?.("");
            }
          }}
          style={{
            ...inputBase,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
            background: disabled ? "var(--color-surface)" : inputBase.background,
          }}
        >
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: selected || value ? "var(--color-text-primary)" : "var(--color-text-muted)",
            }}
          >
            {selected ? selected.label : value ? String(value) : placeholder}
          </span>
          <ChevronDown
            size={15}
            style={{ color: "var(--color-text-muted)", flexShrink: 0, marginLeft: 8 }}
          />
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 60,
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 8px 0" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                 <input
                   autoFocus
                   type="text"
                   placeholder={searchPlaceholder}
                   value={query}
                   onChange={(e) => {
                     const nextQuery = e.target.value;
                     setQuery(nextQuery);
                     if (nextQuery.trim().length >= 3) onSearch?.(nextQuery);
                   }}
                    style={{
                      width: "100%",
                      padding: "7px 10px 7px 32px",
                      border: "1px solid var(--color-border)",
                      borderRadius: 7,
                      fontSize: "var(--font-base)",
                      outline: "none",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                      boxSizing: "border-box",
                    }}
                 />
              </div>
            </div>
            <div ref={listRef} style={{ maxHeight: 220, overflowY: "auto", padding: "4px 6px" }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "16px 8px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--color-text-muted)",
                  }}
                >
                  No options found
                </div>
              ) : (
                <>
                  {filtered.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                       <div
                         key={opt.value}
                         onMouseDown={(event) => {
                           event.preventDefault();
                           event.stopPropagation();
                           onChange(opt.value);
                           setOpen(false);
                         }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--color-surface)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "transparent";
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                          background: isSelected
                            ? "var(--color-surface)"
                            : "transparent",
                        }}
                      >
                        {opt.label}
                      </div>
                    );
                  })}
                  {loadingMore && (
                    <div style={{ padding: "8px", textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>Loading more...</div>
                  )}
                  {!hasMore && filtered.length > 0 && (
                    <div style={{ padding: "8px", textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>No more customers</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchSelect;

