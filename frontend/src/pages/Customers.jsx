import { useMemo, useState, useEffect } from "react";
import { Customer, CustomerAdd, CustomerView, CustomerEdit } from "../customer";
import { FilterPanel } from "../components";
import { Search, MapPin, Building2, SearchX, ArrowLeft } from "lucide-react";
import { fetchStates, fetchCities } from "../utils/masterData";
import { request } from "../config";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Customers({ data, add, setAdd, setRecord, record }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", state: [], city: [] });
  const [localSearch, setLocalSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [stateOptions, setStateOptions] = useState([]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    fetchStates().then(setStateOptions).catch(() => {});
  }, []);

  const loadCustomerOptions = async (query = "") => {
    const params = new URLSearchParams({ limit: "20", offset: "0" });
    if (query.trim()) params.set("name", query.trim());
    const response = await request(`/customers?${params.toString()}`);
    if (!response.ok) return;
    const result = await response.json();
    setCustomerOptions((result.rows || []).map((customer) => ({ value: customer.name, label: customer.name })));
  };

  const [salesPersonOptions, setSalesPersonOptions] = useState(() => {
    const employees = Array.isArray(data?.employees) ? data.employees : (data?.employees?.rows || []);
    const salesPeople = employees.filter((e) => (e.department || "").toLowerCase() === "sales");
    return [...new Set(salesPeople.map((e) => e.fullName).filter(Boolean))]
      .sort()
      .map((person) => ({ value: person, label: person }));
  });

  const loadSalesPeople = async () => {
    const r = await request(`/employees`);
    if (!r.ok) return;
    const result = await r.json();
    const employees = Array.isArray(result) ? result : result.rows || [];
    const salesPeople = employees.filter((e) => (e.department || "").toLowerCase() === "sales");
    setSalesPersonOptions([...new Set(salesPeople.map((e) => e.fullName).filter(Boolean))]
      .sort()
      .map((person) => ({ value: person, label: person })));
  };

  const fetchPage = async (pageNum = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNum - 1) * pageSize) });
      if (nextFilters.name) params.set("name", nextFilters.name);
      if (nextFilters.state?.length) params.set("state", nextFilters.state.join(","));
      if (nextFilters.city?.length) params.set("city", nextFilters.city.join(","));
      if (sortKey) params.set("sortBy", sortKey);
      if (sortDir) params.set("sortDir", sortDir);
      const r = await request(`/customers?${params.toString()}`);
      if (r.ok) {
        const result = await r.json();
        setRows(result.rows || []);
        setTotal(result.total || 0);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error("[Customers] Failed to load page:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(currentPage, filters);
    // Filters are loaded explicitly when they are applied or reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortKey, sortDir]);

  useEffect(() => {
    loadCustomerOptions();
    loadSalesPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.state?.join?.(), filters.city?.join?.()]);

  const activeCount = [filters.name, filters.state.length, filters.city.length].filter(Boolean).length;
  const applyFilters = (nextFilters) => {
    const prevState = filters.state || [];
    const nextState = nextFilters.state || [];
    const wasStateEmpty = prevState.length === 0;
    const stateChanged = !wasStateEmpty && (nextState.length !== prevState.length || nextState.some((s, i) => s !== prevState[i]));
    if (stateChanged) nextFilters.city = [];
    setFilters({ ...nextFilters });
    fetchPage(1, { ...nextFilters });
  };

  const handleReset = () => {
    setFilters({ name: "", state: [], city: [] });
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

  const openCustomerEdit = async (row) => {
    try {
      const response = await request(`/customers/${row.id}`);
      const customer = response.ok ? await response.json() : row;
      setRecord({ ...customer, mode: "edit" });
    } catch {
      setRecord({ ...row, mode: "edit" });
    }
  };

  if (record?.mode === "view") {
    return <CustomerView record={record} onBack={() => setRecord(null)} onEdit={(r) => setRecord({ ...r, mode: "edit" })} />;
  }
  if (record?.mode === "edit") {
    return <CustomerEdit record={record} onBack={() => setRecord(null)} onComplete={() => { setRecord(null); fetchPage(1); }} salesPersonOptions={salesPersonOptions} />;
  }

  return (
    <>
      {add && <CustomerAdd complete={() => { setAdd(false); fetchPage(1); }} salesPersonOptions={salesPersonOptions} />}
      {!add && (
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Customers Management</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-bar" style={{ width: 320, margin: 0 }}>
                <Search size={16} className="text-slate-400" />
                <input
                  placeholder="Search customer..."
                  value={localSearch}
                  onChange={(e) => { const q = e.target.value; setLocalSearch(q); const nextFilters = { ...filters, name: q }; setFilters(nextFilters); if (q.trim().length >= 3 || q.trim().length === 0) fetchPage(1, nextFilters); }}
                />
              </div>
              <button className="primary" onClick={() => setAdd(!add)}>＋ Add</button>
            </div>
          </div>
          <FilterPanel
            fields={[
              { key: "name", label: "Customer Name", type: "search-select", placeholder: "Top customers", searchPlaceholder: "Search all customers...", icon: Search, options: customerOptions, onSearch: loadCustomerOptions },
              { key: "state", label: "State", type: "multi-select", placeholder: "Search states...", icon: Building2, options: stateOptions },
              { key: "city", label: "City", type: "multi-select", placeholder: "Search cities...", icon: MapPin, options: async (localFilters) => {
                const selectedStates = localFilters.state || [];
                if (selectedStates.length === 0) return [];
                const allCities = await fetchCities();
                return selectedStates.flatMap((state) => {
                  const stateObj = stateOptions.find((s) => s.name.toLowerCase() === state.toLowerCase());
                  if (!stateObj) return [];
                  return allCities
                    .filter((c) => String(c.stateId) === String(stateObj.id))
                    .map((city) => ({ value: city.name, label: city.name }));
                });
              }, dependsOn: "state" },
            ]}
             filters={filters}
             onApply={applyFilters}
             onReset={handleReset}
             activeCount={activeCount}
             style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
           >
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
                <div className="spinner" />
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading customers...</div>
              </div>
            ) : rows.length > 0 ? (
              <Customer
                rows={rows}
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
                onEdit={openCustomerEdit}
                onDelete={async (id) => { if (confirm("Delete this customer?")) { await request(`/customers/${id}`, { method: "DELETE" }); fetchPage(currentPage); } }}
              />
            ) : (
              <div className="no-results">
                <SearchX size={64} />
                <h3>No customers found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </FilterPanel>
        </div>
      )}
    </>
  );
}

export default Customers;
