import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, SearchX } from "lucide-react";
import { request } from "../config";
import { Employee, EmployeeAdd, EmployeeEdit, EmployeeView } from "../employee";
import FilterPanel from "../components/FilterPanel";
import { useMasters } from "../hooks/useMasters";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Employees({ add, setAdd, setRecord, record }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ department: "", designation: "" });
  const [sortKey, setSortKey] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(false);
  const masters = useMasters(["departments", "roles"]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const fetchPage = async (pageNumber = 1, nextFilters = filters, query = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNumber - 1) * pageSize), sortBy: sortKey, sortDir });
      if (query.trim()) params.set("name", query.trim());
      if (nextFilters.department) params.set("department", nextFilters.department);
      if (nextFilters.designation) params.set("designation", nextFilters.designation);
      const response = await request(`/employees?${params.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
      setPage(pageNumber);
    } catch (error) {
      console.error("[Employees] Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page, filters, search);
    // Fetch explicitly when paging or sorting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortKey, sortDir]);

  const departmentOptions = useMemo(() => (masters.departments || []).map(({ name }) => ({ value: name, label: name })), [masters.departments]);
  const roleOptions = useMemo(() => (masters.roles || []).map(({ name }) => ({ value: name, label: name })), [masters.roles]);

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
    fetchPage(1, nextFilters, search);
  };

  const resetFilters = () => {
    const empty = { department: "", designation: "" };
    setFilters(empty);
    setSearch("");
    setPage(1);
    fetchPage(1, empty, "");
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (value.trim().length >= 3 || value.trim().length === 0) fetchPage(1, filters, value);
  };

  const handleSort = (key) => {
    setSortKey((previous) => {
      const nextDirection = previous === key && sortDir === "asc" ? "desc" : "asc";
      setSortDir(nextDirection);
      return key;
    });
    setPage(1);
  };

  const refresh = () => {
    setAdd(false);
    setRecord(null);
    fetchPage(1, filters, search);
  };

  if (record?.mode === "view") return <EmployeeView record={record} onBack={() => setRecord(null)} onEdit={(value) => setRecord({ ...value, mode: "edit" })} />;
  if (record?.mode === "edit") return <EmployeeEdit record={record} onBack={() => setRecord(null)} onComplete={refresh} />;
  if (add) return <EmployeeAdd complete={refresh} />;

  return (
    <div className="card employee-management-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "visible" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.history.back()} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Employees Management</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="search-bar" style={{ width: 260, margin: 0 }}>
            <Search size={16} className="text-slate-400" />
            <input placeholder="Search employee..." value={search} onChange={(event) => handleSearch(event.target.value)} />
          </div>
          <button className="primary" onClick={() => setAdd(true)}>＋ Add</button>
        </div>
      </div>

      <FilterPanel
        fields={[
          { key: "department", label: "Department", type: "multi-select", placeholder: "All departments", options: departmentOptions },
          { key: "designation", label: "Designation", type: "multi-select", placeholder: "All designations", options: roleOptions },
        ]}
        filters={{ department: filters.department ? [filters.department] : [], designation: filters.designation ? [filters.designation] : [] }}
        onApply={(next) => applyFilters({ department: next.department?.[0] || "", designation: next.designation?.[0] || "" })}
        onReset={resetFilters}
        activeCount={[filters.department, filters.designation].filter(Boolean).length}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {loading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 240, gap: 10 }}><div className="spinner" /><div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading employees...</div></div>
        ) : rows.length ? (
          <Employee
            rows={rows}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            currentPage={page}
            totalPages={totalPages}
            safeCurrentPage={safePage}
            onPageSizeChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
            onJumpToPage={(event) => setPage(Number(event.target.value))}
            onPrevPage={() => setPage((value) => Math.max(1, value - 1))}
            onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onView={(row) => setRecord({ ...row, mode: "view" })}
            onEdit={(row) => setRecord({ ...row, mode: "edit" })}
            onDelete={async (id) => { if (window.confirm("Delete this employee?")) { await request(`/employees/${id}`, { method: "DELETE" }); fetchPage(page, filters, search); } }}
          />
        ) : (
          <div className="no-results"><SearchX size={64} /><h3>No employees found</h3><p>Try adjusting your search or filters.</p></div>
        )}
      </FilterPanel>
    </div>
  );
}

export default Employees;
