import { Item, ItemAdd, ItemView, ItemEdit } from "../item";
import { useMemo, useState, useEffect } from "react";
import { FilterPanel } from "../components";
import { Search, Tag, CircleCheck, ArrowLeft, SearchX } from "lucide-react";
import { request } from "../config";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Items({ add, setAdd, setRecord, record, remove }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", status: [], stock: [] });
  const [localSearch, setLocalSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const options = (key, sourceRows) => [...new Set((sourceRows || []).map((row) => row[key]).filter(Boolean))]
    .sort().map((value) => ({ value, label: value }));
  const fields = useMemo(() => [
    { key: "name", label: "Item", type: "search-select", placeholder: "Top items", searchPlaceholder: "Search all items...", icon: Search, options: options("name", rows) },
    { key: "status", label: "Status", type: "multi-select", placeholder: "All statuses", icon: CircleCheck, options: options("status", rows) },
    { key: "stock", label: "Stock level", type: "multi-select", placeholder: "All stock levels", icon: Tag, options: [{ value: "low", label: "Low stock (10 or less)" }, { value: "available", label: "Available stock" }, { value: "out", label: "Out of stock" }] },
  ], [options, rows]);
  const matchesSearch = (row) => !localSearch || localSearch.trim().length < 3 || (String(row.name || "") + " " + String(row.sku || "")).toLowerCase().includes(localSearch.toLowerCase());
  const filteredList = useMemo(() => (rows || []).filter((row) =>
    matchesSearch(row) &&
    (!filters.name || row.name === filters.name) &&
    (!filters.status.length || filters.status.includes(row.status)) &&
    (!filters.stock.length || (filters.stock.includes("low") && Number(row.stock) <= 10 && Number(row.stock) > 0) || (filters.stock.includes("available") && Number(row.stock) > 10) || (filters.stock.includes("out") && Number(row.stock) === 0))
  ), [rows, filters, matchesSearch]);
  const activeCount = [filters.name, filters.status.length, filters.stock.length].filter(Boolean).length;

  const fetchPage = async (pageNum = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNum - 1) * pageSize) });
      if (nextFilters.name) params.set('name', nextFilters.name);
      if (nextFilters.status?.length) params.set('status', nextFilters.status.join(','));
      if (nextFilters.stock?.length) params.set('stock', nextFilters.stock.join(','));
      const r = await request(`/items?${params.toString()}`);
      if (r.ok) {
        const result = await r.json();
        const list = Array.isArray(result) ? result : result.rows || [];
        const total = Array.isArray(result) ? list.length : result.total || 0;
        setRows(list);
        setTotal(total);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error('[Items] Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortKey, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.status?.join?.(), filters.stock?.join?.()]);

  const applyFilters = (nextFilters) => {
    setFilters({ ...nextFilters });
    fetchPage(1, { ...nextFilters });
  };

  const handleReset = () => {
    setFilters({ name: "", status: [], stock: [] });
    setSortKey("name");
    setSortDir("asc");
  };

  const handleSort = (key) => {
    setSortKey((prev) => {
      const nextDir = prev === key && sortDir === "asc" ? "desc" : "asc";
      setSortDir(nextDir);
      setCurrentPage(1);
      return key;
    });
  };

  if (record?.mode === "view") {
    return <ItemView record={record} onBack={() => setRecord(null)} onEdit={(r) => setRecord({ ...r, mode: "edit" })} />;
  }
  if (record?.mode === "edit") {
    return <ItemEdit record={record} onBack={() => setRecord(null)} onComplete={() => { setRecord(null); fetchPage(1); }} />;
  }
  return (
    <>
      {add && <ItemAdd complete={() => { setAdd(false); fetchPage(1); }} />}
      {!add && (
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Items Management</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-bar" style={{ width: 320, margin: 0 }}>
                <Search size={16} className="text-slate-400" />
                <input placeholder="Search item..." value={localSearch} onChange={(e) => { const q = e.target.value; setLocalSearch(q); const nextFilters = { ...filters, name: q }; setFilters(nextFilters); if (q.trim().length >= 3 || q.trim().length === 0) fetchPage(1, nextFilters); }} />
              </div>
              <button className="primary" onClick={() => setAdd(!add)}>＋ Add</button>
            </div>
          </div>
          <FilterPanel fields={fields} filters={filters} onApply={applyFilters} onReset={handleReset} activeCount={activeCount} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
                <div className="spinner" />
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading items...</div>
              </div>
            ) : filteredList.length > 0 ? (
              <Item
                rows={filteredList}
                total={total}
                load={() => fetchPage(currentPage)}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                currentPage={currentPage}
                totalPages={totalPages}
                safeCurrentPage={safeCurrentPage}
                onPageSizeChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                onJumpToPage={(e) => { const p = Number(e.target.value); if (p >= 1 && p <= totalPages) setCurrentPage(p); }}
                onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onView={(row) => setRecord({ ...row, mode: "view" })}
                onEdit={(row) => setRecord({ ...row, mode: "edit" })}
                onDelete={async (id) => { if (confirm("Delete this item?")) { await request(`/items/${id}`, { method: "DELETE" }); fetchPage(currentPage); } }}
              />
            ) : (
              <div className="no-results">
                <SearchX size={64} />
                <h3>No items found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </FilterPanel>
        </div>
      )}
    </>
  );
}

export default Items;

