import { User, UserAdd, UserView, UserEdit } from "../user";
import { useMemo, useState, useEffect } from "react";
import { FilterPanel } from "../components";
import { Search, Briefcase, ArrowLeft, SearchX } from "lucide-react";
import { request } from "../config";
import { useMasters } from "../hooks/useMasters";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function getRolesForDepartmentsFromApi(departmentNames, allRoles, allDepartments) {
  if (!allRoles || !allDepartments) return [];
  if (!departmentNames || departmentNames.length === 0) return allRoles.map((r) => r.name);
  const deptIds = departmentNames
    .map((name) => allDepartments.find((d) => d.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean)
    .map((d) => String(d.id));
  return [...new Set(allRoles.filter((r) => deptIds.includes(String(r.departmentId))).map((r) => r.name))];
}

function Users({ add, setAdd, setRecord, record, employees = [] }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", department: [], role: [] });
  const [localSearch, setLocalSearch] = useState("");
  const [userNameOptions, setUserNameOptions] = useState([]);
  const [sortKey, setSortKey] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const masters = useMasters(["departments", "roles"]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const options = (key, sourceRows) => [...new Set((sourceRows || []).map((row) => key === "role" ? (row.role || row.designation) : row[key]).filter(Boolean))]
    .sort().map((value) => ({ value, label: value }));
  const userNameOptionsFromList = useMemo(() => {
    const values = new Set();
    (rows || []).forEach((row) => {
      if (row.fullName) values.add(row.fullName);
      if (row.username) values.add(row.username);
    });
    return [...values].sort().map((value) => ({ value, label: value }));
  }, [rows]);

  const fields = useMemo(() => [
    { key: "name", label: "User", type: "search-select", placeholder: "Top users", searchPlaceholder: "Search all users...", icon: Search, options: userNameOptions },
    { key: "department", label: "Department", type: "multi-select", placeholder: "All departments", icon: Briefcase, options: (masters.departments || []).map((d) => ({ value: d.name, label: d.name })) },
    {
      key: "role", label: "Role", type: "multi-select", placeholder: "All roles", icon: Briefcase,
      dependsOn: "department",
      options: (localFilters) => {
        const depts = localFilters.department || [];
        const mapped = getRolesForDepartmentsFromApi(depts, masters.roles || [], masters.departments || []);
        const actual = options("role", rows).map((o) => o.value);
        if (depts.length === 0) return options("role", rows);
        return mapped
          .map((name) => name.toLowerCase())
          .filter((lc) => actual.some((a) => a.toLowerCase() === lc))
          .map((lc) => ({ value: actual.find((a) => a.toLowerCase() === lc), label: actual.find((a) => a.toLowerCase() === lc) }));
      },
    },
  ], [options, userNameOptions, rows, masters.departments, masters.roles]);

  const matchesSearch = (row) => !localSearch || localSearch.trim().length < 3 || (String(row.fullName || "") + " " + String(row.username || "")).toLowerCase().includes(localSearch.toLowerCase());
  const filteredList = useMemo(() => (rows || []).filter((row) =>
    matchesSearch(row) &&
    (!filters.name || row.fullName === filters.name || row.username === filters.name) &&
    (!filters.department.length || filters.department.some((d) => d.toLowerCase() === String(row.department || "").toLowerCase())) &&
    (!filters.role.length || filters.role.some((r) => r.toLowerCase() === String(row.role || row.designation || "").toLowerCase()))
  ), [rows, filters, matchesSearch]);
  const activeCount = [filters.name, filters.department.length, filters.role.length].filter(Boolean).length;

  const fetchPage = async (pageNum = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNum - 1) * pageSize) });
      if (nextFilters.name) params.set('name', nextFilters.name);
      if (nextFilters.department?.length) params.set('department', nextFilters.department.join(','));
      if (nextFilters.role?.length) params.set('role', nextFilters.role.join(','));
      if (sortKey) params.set('sortBy', sortKey);
      if (sortDir) params.set('sortDir', sortDir);
      const r = await request(`/users?${params.toString()}`);
      if (r.ok) {
        const result = await r.json();
        const list = Array.isArray(result) ? result : result.rows || [];
        const total = Array.isArray(result) ? list.length : result.total || 0;
        setRows(list);
        setTotal(total);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error('[Users] Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortKey, sortDir]);

  useEffect(() => {
    setUserNameOptions(userNameOptionsFromList);
  }, [userNameOptionsFromList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.department?.join?.(), filters.role?.join?.()]);

  const applyFilters = (nextFilters) => {
    setFilters({ ...nextFilters });
    fetchPage(1, { ...nextFilters });
  };

  const handleReset = () => {
    setFilters({ name: "", department: [], role: [] });
    setSortKey("fullName");
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
    return <UserView record={record} onBack={() => setRecord(null)} onEdit={(r) => setRecord({ ...r, mode: "edit" })} />;
  }
  if (record?.mode === "edit") {
    return <UserEdit record={record} onBack={() => setRecord(null)} onComplete={() => { setRecord(null); fetchPage(1); }} employees={employees} />;
  }
  return (
    <>
      {add && <UserAdd complete={() => { setAdd(false); fetchPage(1); }} onBack={() => setAdd(false)} employees={employees} />}
      {!add && (
        <div className="page-with-title-row" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, gap: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Users Management</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-bar" style={{ width: 320, margin: 0 }}>
                <Search size={16} className="text-slate-400" />
                <input placeholder="Search user..." value={localSearch} onChange={(e) => { const q = e.target.value; setLocalSearch(q); const nextFilters = { ...filters, name: q }; setFilters(nextFilters); if (q.trim().length >= 3 || q.trim().length === 0) fetchPage(1, nextFilters); }} />
              </div>
              <button className="primary" onClick={() => setAdd(!add)}>＋ Add</button>
            </div>
          </div>
          <div className="card page-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <FilterPanel fields={fields} filters={filters} onApply={applyFilters} onReset={handleReset} activeCount={activeCount} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
                <div className="spinner" />
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading users...</div>
              </div>
            ) : filteredList.length > 0 ? (
              <User
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
                onDelete={async (id) => { if (confirm("Delete this user?")) { await request(`/users/${id}`, { method: "DELETE" }); fetchPage(currentPage); } }}
              />
            ) : (
              <div className="no-results">
                <SearchX size={64} />
                <h3>No users found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </FilterPanel>
          </div>
        </div>
      )}
    </>
  );
}

export default Users;