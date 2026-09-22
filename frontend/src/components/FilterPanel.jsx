import { useState, useCallback, useEffect, useRef } from "react";
import { X, Search, ChevronDown, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import SearchSelect from "./SearchSelect";

function FilterPanel({ fields, filters, onApply, onReset, activeCount, children, style }) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [multiSearch, setMultiSearch] = useState({});
  const [multiOpen, setMultiOpen] = useState({});
  const multiRefs = useRef({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalFilters({ ...filters }); }, [filters]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const updateFilter = useCallback((key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

 const resolveFieldOptions = useCallback((field) => {
  const options =
    typeof field.options === "function"
      ? field.options(localFilters)
      : field.options;

  return Array.isArray(options) ? options : [];
}, [localFilters]);

  const toggleMultiOption = useCallback((key, option) => {
    const dependentKeys = fields
      .filter((f) => f.dependsOn === key)
      .map((f) => f.key);

    setLocalFilters((prev) => {
      const current = prev[key] || [];
      let updated;
      if (Array.isArray(current)) {
        const exists = current.includes(option);
        updated = exists ? current.filter((v) => v !== option) : [...current, option];
      } else {
        updated = [option];
      }
      if (dependentKeys.length === 0) {
        return { ...prev, [key]: updated };
      }
      const next = { ...prev, [key]: updated };
      dependentKeys.forEach((depKey) => { next[depKey] = []; });
      return next;
    });

    if (dependentKeys.length > 0) {
      setMultiSearch((prev) => {
        const next = { ...prev };
        dependentKeys.forEach((depKey) => { next[depKey] = ""; });
        return next;
      });
    }
  }, [fields]);

  // Close multi dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      Object.keys(multiOpen).forEach((key) => {
        if (multiOpen[key]) {
          const ref = multiRefs.current[key];
          if (ref && !ref.contains(e.target)) {
            setMultiOpen((prev) => ({ ...prev, [key]: false }));
          }
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [multiOpen]);

  const handleApply = useCallback(() => {
    onApply({ ...localFilters });
    setOpen(false);
  }, [localFilters, onApply]);

  const handleReset = useCallback(() => {
    const empty = {};
    fields.forEach((f) => {
      if (f.type === "multi-select") {
        empty[f.key] = [];
      } else {
        empty[f.key] = "";
      }
    });
    setLocalFilters(empty);
    setMultiSearch({});
    setMultiOpen({});
    onReset();
    setOpen(false);
  }, [fields, onReset]);

  // Helper to get display text for filter value
  const getLabel = useCallback((field, val) => {
    if (field.type === "multi-select" && Array.isArray(val) && val.length > 0) {
      return val.length === 1 ? val[0] : `${val.length} selected`;
    }
    return val;
  }, []);

  const removeFilter = useCallback((key) => {
    const field = fields.find((f) => f.key === key);
    const empty = field?.type === "multi-select" ? [] : "";
    onApply({ ...filters, [key]: empty });
  }, [fields, filters, onApply]);

  const activeFilterChips = useCallback(() => {
    const chips = [];
    fields.forEach((field) => {
      const val = filters[field.key];
      if (!val && val !== 0) return;
      if (Array.isArray(val) && val.length === 0) return;
      if (typeof val === "string" && val.trim() === "") return;
      const label = getLabel(field, val);
      if (!label) return;
      chips.push(
        <span key={field.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-sm font-semibold border border-blue-100 dark:border-blue-500/20">
          {field.label}: {label}
          <button onClick={() => removeFilter(field.key)} className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors">
            <X size={12} />
          </button>
        </span>
      );
    });
    return chips;
  }, [fields, filters, getLabel, removeFilter]);

  // Render a multi-select dropdown with search and checkboxes
  const renderMultiSelect = useCallback((field) => {
    const val = localFilters[field.key] || [];
    const selected = Array.isArray(val) ? val : [];
    const isOpen = !!multiOpen[field.key];
    const searchTerm = (multiSearch[field.key] || "").toLowerCase();
    const options = resolveFieldOptions(field);

    // Show top 20 by default, or search results if searching with 3+ chars
    const displayOptions = searchTerm.length >= 3
      ? (options || []).filter((opt) => opt.label.toLowerCase().includes(searchTerm))
      : (options || []).slice(0, 20);

    const hasMoreOptions = !searchTerm && (options || []).length > 20;

    return (
      <div key={`${field.key}-${options?.length || 0}`} ref={(el) => (multiRefs.current[field.key] = el)} style={{ position: "relative" }}>
        {/* Dropdown trigger button */}
        <button
          type="button"
          onClick={() => {
            setMultiOpen((prev) => ({ ...prev, [field.key]: !prev[field.key] }));
            setMultiSearch((prev) => ({ ...prev, [field.key]: "" }));
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[var(--color-surface-card)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
        >
          <span className="flex-1 text-left truncate">
            {selected.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-400">{field.placeholder || "All"}</span>
            ) : (
              <span className="text-slate-900 dark:text-slate-100 font-medium">{selected.length} selected</span>
            )}
          </span>
          <ChevronDown size={15} className={`text-slate-400 dark:text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 60,
              background: "var(--color-surface-card, #fff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            {/* Search inside dropdown */}
            <div style={{ padding: "8px 8px 0" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted, #94a3b8)" }} />
                 <input
                   type="text"
                   placeholder="Search..."
                   value={multiSearch[field.key] || ""}
                   onChange={(e) => {
                     const value = e.target.value;
                     setMultiSearch((prev) => ({ ...prev, [field.key]: value }));
                     if (value.trim().length >= 3) {
                       field.onSearch?.(value);
                     }
                   }}
                   style={{
                     width: "100%",
                     padding: "7px 10px 7px 32px",
                     border: "1px solid var(--color-border, #e2e8f0)",
                     borderRadius: 8,
                     fontSize: 13,
                     outline: "none",
                     background: "var(--color-surface, #f8fafc)",
                     color: "var(--color-text-primary, #0f172a)",
                     boxSizing: "border-box",
                   }}
                 />
              </div>
            </div>
            {/* Options list */}
            <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 6px" }}>
              {displayOptions.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 13, color: "var(--color-text-muted, #94a3b8)" }}>No options found</div>
              ) : (
                displayOptions.map((opt) => {
                  const isChecked = selected.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      onClick={() => toggleMultiOption(field.key, opt.value)}
                      className="filter-option"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: isChecked ? 600 : 400,
                        color: isChecked ? "var(--color-text-primary, #0f172a)" : "var(--color-text-secondary, #475569)",
                        background: isChecked ? "rgba(59, 130, 246, 0.12)" : "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { if (document.documentElement.classList.contains("dark")) { e.target.style.background = isChecked ? "rgba(59, 130, 246, 0.25)" : "rgba(148, 163, 184, 0.15)"; } else if (!isChecked) { e.target.style.background = "#f8fafc"; } else { e.target.style.background = "rgba(59, 130, 246, 0.18)"; } }}
                      onMouseLeave={(e) => { e.target.style.background = isChecked ? "rgba(59, 130, 246, 0.12)" : "transparent"; }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `2px solid ${isChecked ? "#3b82f6" : "var(--color-border, #cbd5e1)"}`,
                          background: isChecked ? "#3b82f6" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                      >
                        {isChecked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ flex: 1 }}>{opt.label}</span>
                    </label>
                  );
                })
              )}
              {hasMoreOptions && (
                <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--color-text-muted, #94a3b8)", textAlign: "center", fontStyle: "italic" }}>
                  Search to see more options ({(options || []).length - 20} more)
                </div>
              )}
            </div>
            {/* Footer with apply + clear */}
            <div style={{ padding: "6px 8px 8px", borderTop: "1px solid var(--color-border, #f1f5f9)", display: "flex", gap: 6 }}>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalFilters((prev) => ({ ...prev, [field.key]: [] }));
                    setMultiSearch((prev) => ({ ...prev, [field.key]: "" }));
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    background: "#f1f5f9",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                  }}
                >
                  Clear
                </button>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMultiOpen((prev) => ({ ...prev, [field.key]: false }))}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    background: "#3b82f6",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                  }}
                >
                  Apply
                </button>
              )}
              {selected.length === 0 && (
                <button
                  type="button"
                  onClick={() => setMultiOpen((prev) => ({ ...prev, [field.key]: false }))}
                  style={{
                    width: "100%",
                    padding: "6px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    background: "#f1f5f9",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [localFilters, multiSearch, multiOpen, toggleMultiOption, resolveFieldOptions]);

  return (
    <div className="filter-panel relative" style={style}>
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-border) transparent" }}>
        <style>{`
          .filter-panel .overflow-x-auto::-webkit-scrollbar {
            height: 6px;
          }
          .filter-panel .overflow-x-auto::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }
          .filter-panel .overflow-x-auto::-webkit-scrollbar-thumb {
            background: var(--color-border, #cbd5e1);
            border-radius: 3px;
          }
          .filter-panel .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: var(--color-text-muted, #94a3b8);
          }
          .dark .filter-panel .overflow-x-auto::-webkit-scrollbar-thumb {
            background: var(--color-border, #475569);
          }
          .dark .filter-panel .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: var(--color-text-muted, #94a3b8);
          }
        `}</style>
        <button onClick={() => { setLocalFilters({ ...filters }); setOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[var(--color-surface-card)] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md">
          <SlidersHorizontal size={16} />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">{activeCount}</span>
          )}
        </button>
        {activeCount > 0 && <div className="flex items-center gap-2 shrink-0">{activeFilterChips()}</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[var(--color-surface-card)] h-full shadow-2xl border-r border-slate-200 dark:border-slate-700 overflow-y-auto"
            style={{ animation: "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div className="sticky top-0 z-10 bg-white dark:bg-[var(--color-surface-card)] border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center">
                  <SlidersHorizontal size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Filters</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeCount > 0 ? activeCount + " filter" + (activeCount > 1 ? "s" : "") + " active" : "No filters applied"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <RotateCcw size={13} />
                    Clear all
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {fields.map((field) => {
                const Icon = field.icon || Search;
                const fieldOptions = resolveFieldOptions(field);
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <Icon size={15} className="text-slate-400 dark:text-slate-500" />
                      {field.label}
                    </label>
                    {field.type === "search-select" ? (
                      <SearchSelect
                        value={localFilters[field.key] || ""}
                        options={fieldOptions || []}
                        onChange={(value) => updateFilter(field.key, value)}
                        onSearch={field.onSearch}
                        placeholder={field.placeholder || "Select..."}
                        searchPlaceholder={field.searchPlaceholder || "Search..."}
                      />
                    ) : field.type === "text" ? (
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input type="text" placeholder={field.placeholder || "Search..."}
                          value={localFilters[field.key] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateFilter(field.key, value);
                            if (value.trim().length >= 3) {
                              field.onSearch?.(value);
                            }
                          }}
                          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[var(--color-surface)] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                        {localFilters[field.key] && (
                          <button onClick={() => updateFilter(field.key, "")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : field.type === "date" ? (
                      <input
                        type="date"
                        value={localFilters[field.key] || ""}
                        onChange={(e) => updateFilter(field.key, e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[var(--color-surface)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      />
                    ) : field.type === "multi-select" ? (
                      renderMultiSelect(field)
                    ) : (
                      <div className="relative">
                        <select value={localFilters[field.key] || ""}
                          onChange={(e) => updateFilter(field.key, e.target.value)}
                          className="w-full pl-3 pr-9 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[var(--color-surface)] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                          <option value="">{field.placeholder || "All"}</option>
                          {(fieldOptions || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-[var(--color-surface-card)] border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center gap-3">
              <button onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 rounded-xl transition-colors">
                <RotateCcw size={15} />
                Reset
              </button>
              <button onClick={handleApply}
                className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all">
                <Check size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default FilterPanel;
