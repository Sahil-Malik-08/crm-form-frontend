import { useMemo, useState, useEffect } from "react";
import { Order, OrderAdd, OrderView, OrderEdit } from "../order";
import { FilterPanel } from "../components";
import { Search, MapPin, UserRound, CircleCheck, Building2, SearchX, ArrowLeft } from "lucide-react";
import { fetchStates, fetchCities } from "../utils/masterData";
import { request } from "../config";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function OrdersPage({ data, add, setAdd, setRecord, record, onOrdersTableScroll, isFullscreen }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(isFullscreen ? 15 : 10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ customer: "", status: [], employee: [], state: [], city: [], dateFrom: "", dateTo: "" });
  const [localSearch, setLocalSearch] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const pageSizeOptions = isFullscreen ? [15, 20, 50, 100] : PAGE_SIZE_OPTIONS;

  useEffect(() => {
    setCurrentPage(1);
    setPageSize(isFullscreen ? 15 : 10);
  }, [isFullscreen]);

  useEffect(() => {
    fetchStates().then(setStateOptions).catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const loadCustomerOptions = async (query = "") => {
    const params = new URLSearchParams({ limit: "20", offset: "0" });
    if (query.trim()) params.set("name", query.trim());
    const response = await request(`/customers?${params.toString()}`);
    if (!response.ok) return;
    const result = await response.json();
    setCustomerOptions((result.rows || []).map((customer) => ({ value: customer.name, label: customer.name })));
  };

  const loadEmployeeOptions = async () => {
    const r = await request(`/employees`);
    if (!r.ok) return;
    const result = await r.json();
    const all = Array.isArray(result) ? result : result.rows || [];
    const sales = all.filter((e) => (e.department || "").toLowerCase() === "sales");
    setEmployeeOptions(sales.map((e) => ({ value: e.fullName, label: e.fullName })));
  };

  const statusOptions = useMemo(() => ["Pending", "Processing", "Completed", "Cancelled"].map((value) => ({ value, label: value })), []);

  const fetchPage = async (pageNum = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNum - 1) * pageSize) });
      if (nextFilters.customer) params.set('customer', nextFilters.customer);
      if (nextFilters.status?.length) params.set('status', nextFilters.status.join(','));
      if (nextFilters.employee?.length) params.set('employee', nextFilters.employee.join(','));
      if (nextFilters.state?.length) params.set('state', nextFilters.state.join(','));
      if (nextFilters.city?.length) params.set('city', nextFilters.city.join(','));
      if (nextFilters.dateFrom) params.set('dateFrom', nextFilters.dateFrom);
      if (nextFilters.dateTo) params.set('dateTo', nextFilters.dateTo);
      if (sortKey) params.set('sortBy', sortKey);
      if (sortDir) params.set('sortDir', sortDir);
      const r = await request(`/orders?${params.toString()}`);
      if (r.ok) {
        const result = await r.json();
        setRows(result.rows || []);
        setTotal(result.total || 0);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error('[OrdersPage] Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    if (key === 'actions' || key === 'status') return;
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    fetchPage(1, filters);
  };

  useEffect(() => {
    fetchPage(currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadCustomerOptions();
    loadEmployeeOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.customer, filters.status?.join?.(), filters.employee?.join?.(), filters.state?.join?.(), filters.city?.join?.(), filters.dateFrom, filters.dateTo]);

  const activeCount = [filters.customer, filters.status.length, filters.employee.length, filters.state.length, filters.city.length, filters.dateFrom, filters.dateTo].filter(Boolean).length;
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
    setFilters({ customer: "", status: [], employee: [], state: [], city: [], dateFrom: "", dateTo: "" });
  };

  const openOrderEdit = async (row) => {
    try {
      const response = await request(`/orders/${row.id}`);
      const order = response.ok ? await response.json() : row;
      setRecord({ ...order, mode: "edit" });
    } catch {
      setRecord({ ...row, mode: "edit" });
    }
  };

  if (record?.mode === "view") {
    return <OrderView record={record} onBack={() => setRecord(null)} onEdit={openOrderEdit} />;
  }
  if (record?.mode === "edit") {
    return <OrderEdit record={record} data={data} onBack={() => setRecord(null)} onComplete={() => { setRecord(null); fetchPage(1); }} />;
  }
  return (
    <>
              {add && <OrderAdd data={data} complete={() => { setAdd(false); fetchPage(1); }} onBack={() => window.history.back()} />}
      {!add && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Order Management</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-bar" style={{ width: 320, margin: 0 }}>
                <Search size={16} className="text-slate-400" />
                <input
                  placeholder="Search order..."
                  value={localSearch}
                  onChange={(e) => { const q = e.target.value; setLocalSearch(q); const nextFilters = { ...filters, customer: q }; setFilters(nextFilters); if (q.trim().length >= 3 || q.trim().length === 0) fetchPage(1, nextFilters); }}
                />
              </div>
              <button className="primary" onClick={() => setAdd(!add)}>＋ Add</button>
            </div>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <FilterPanel fields={[
             { key: "customer", label: "Customer", type: "search-select", placeholder: "Top 20 customers", searchPlaceholder: "Search all customers...", icon: Search, options: customerOptions, onSearch: loadCustomerOptions },
            { key: "status", label: "Status", type: "multi-select", placeholder: "All statuses", icon: CircleCheck, options: statusOptions },
            { key: "employee", label: "Assigned employee", type: "multi-select", placeholder: "All employees", icon: UserRound, options: employeeOptions },
            { key: "state", label: "State", type: "multi-select", placeholder: "All states", icon: Building2, options: stateOptions },
            { key: "city", label: "City", type: "multi-select", placeholder: "All cities", icon: MapPin, options: async (localFilters) => {
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
            { key: "dateFrom", label: "Date from", type: "date", placeholder: "From date", icon: Search },
            { key: "dateTo", label: "Date to", type: "date", placeholder: "To date", icon: Search },
          ]} filters={filters} onApply={applyFilters} onReset={handleReset} activeCount={activeCount} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
                <div className="spinner" />
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading orders...</div>
              </div>
            ) : rows.length > 0 ? (
              <Order
                rows={rows}
                total={total}
                load={() => fetchPage(currentPage)}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
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
                onEdit={openOrderEdit}
                onDelete={async (id) => { if (confirm('Delete this order?')) { await request(`/orders/${id}`, { method: 'DELETE' }); fetchPage(currentPage); } }}
                onOrdersTableScroll={onOrdersTableScroll}
              />
            ) : (
              <div className="no-results">
                <SearchX size={64} />
                <h3>No orders found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </FilterPanel>
        </div>
        </>
      )}
    </>
  );
}

export default OrdersPage;
