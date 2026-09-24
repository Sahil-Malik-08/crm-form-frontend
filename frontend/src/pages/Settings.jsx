import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, Pencil, Trash2, Plus, Check, X, Search, MapPin } from "lucide-react";
import { SETTINGS_MASTERS } from "../config";
import { fetchStates, fetchCities, fetchDepartments, fetchRoles, addMaster, updateMaster, deleteMaster } from "../utils/masterData";
import FormMaster from "./FormMaster";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function MasterTable({ masterKey, label }) {
  const [rows, setRows] = useState([]);
  const [stateRows, setStateRows] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [newStateId, setNewStateId] = useState("");
  const [editStateId, setEditStateId] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const inputContainerRef = useRef(null);

  const isCityMaster = masterKey === "cities";
  const isRoleMaster = masterKey === "roles";

  const load = useCallback(async () => {
    try {
      setError(null);
      let data;
      if (masterKey === "states") {
        data = await fetchStates();
      } else if (masterKey === "cities") {
        data = await fetchCities();
      } else if (masterKey === "departments") {
        data = await fetchDepartments();
      } else if (masterKey === "roles") {
        data = await fetchRoles();
      }
      setRows(data || []);
      if (masterKey === "cities") {
        const stateData = await fetchStates();
        setStateRows(stateData || []);
      }
      if (masterKey === "roles") {
        const deptData = await fetchDepartments();
        setStateRows(deptData || []);
      }
    } catch (err) {
      setError(err.message);
      setRows([]);
    }
  }, [masterKey]);

  useEffect(() => { load(); }, [masterKey, load]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = newName.trim().toLowerCase();
    if (!q) return [];

    let results = [];

    if (isCityMaster) {
      const selectedStateObj = stateRows.find((s) => String(s.id) === String(newStateId));
      const selectedStateName = selectedStateObj ? selectedStateObj.name : "";

      if (selectedStateName) {
        results = rows
          .filter((r) => String(r.stateId) === String(newStateId) && r.name.toLowerCase().includes(q))
          .map((city) => ({
            name: city.name,
            stateId: newStateId,
            stateName: selectedStateName,
            isAdded: true,
          }));
      } else {
        results = rows
          .filter((r) => r.name.toLowerCase().includes(q))
          .map((city) => {
            const stateObj = stateRows.find((s) => String(s.id) === String(city.stateId));
            return {
              name: city.name,
              stateId: city.stateId,
              stateName: stateObj ? stateObj.name : "",
              isAdded: true,
            };
          });
      }
    } else if (isRoleMaster) {
      const selectedDeptObj = stateRows.find((d) => String(d.id) === String(newStateId));
      const selectedDeptName = selectedDeptObj ? selectedDeptObj.name : "";

      if (selectedDeptName) {
        results = rows
          .filter((r) => String(r.departmentId) === String(newStateId) && r.name.toLowerCase().includes(q))
          .map((role) => ({
            name: role.name,
            departmentId: newStateId,
            departmentName: selectedDeptName,
            isAdded: true,
          }));
      } else {
        results = rows
          .filter((r) => r.name.toLowerCase().includes(q))
          .map((role) => {
            const deptObj = stateRows.find((d) => String(d.id) === String(role.departmentId));
            return {
              name: role.name,
              departmentId: role.departmentId,
              departmentName: deptObj ? deptObj.name : "",
              isAdded: true,
            };
          });
      }
    } else if (masterKey === "states") {
      results = rows
        .filter((r) => r.name.toLowerCase().includes(q))
        .map((s) => ({
          name: s.name,
          isAdded: true,
        }));
    } else if (masterKey === "departments") {
      results = rows
        .filter((r) => r.name.toLowerCase().includes(q))
        .map((d) => ({
          name: d.name,
          isAdded: true,
        }));
    }

    return results.slice(0, 10);
  }, [newName, isCityMaster, isRoleMaster, masterKey, stateRows, newStateId, rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = q
      ? rows.filter((row) => [row.name, row.stateName, row.departmentName].some((value) => String(value || "").toLowerCase().includes(q)))
      : rows;
    return [...matches].sort((a, b) => (sortDir === "asc" ? 1 : -1) * String(a.name).localeCompare(String(b.name)));
  }, [rows, search, sortDir]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const closeAdd = () => {
    setShowAdd(false);
    setNewName("");
    setNewStateId("");
    setShowSuggestions(false);
    setError(null);
  };

  const handleSelectSuggestion = (item) => {
    setNewName(item.name);
    if (isCityMaster && item.stateId) {
      setNewStateId(String(item.stateId));
    }
    if (isRoleMaster && item.departmentId) {
      setNewStateId(String(item.departmentId));
    }
    setShowSuggestions(false);
  };

  const add = async (e) => {
    e.preventDefault();
    if ((isCityMaster || isRoleMaster) && !newStateId) {
      setError(`Please select a ${isCityMaster ? "state" : "department"}.`);
      return;
    }
    if (!newName.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { name: newName.trim() };
      if (isCityMaster) body.stateId = Number(newStateId);
      if (isRoleMaster) body.departmentId = Number(newStateId);
      await addMaster(masterKey, body);
      closeAdd();
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const save = async (id) => {
    if (!editName.trim()) return;
    setError(null);
    try {
      const body = { name: editName.trim() };
      if (isCityMaster) body.stateId = Number(editStateId);
      if (isRoleMaster) body.departmentId = Number(editStateId);
      await updateMaster(masterKey, id, body);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this record?")) return;
    setError(null);
    try {
      await deleteMaster(masterKey, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const noun = label.replace(" Master", "");
  const parentNoun = isCityMaster ? "State" : "Department";
  const hasParent = isCityMaster || isRoleMaster;

  if (showAdd) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
        {error && <div className="fb-notice error">{error}</div>}
        <form className="card ef-card" onSubmit={add} noValidate>
          <div className="ef-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={closeAdd} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h3 className="ef-title">Add {noun.toLowerCase()}</h3>
                <div className="ef-meta">Add a new record to the {label.toLowerCase()}.</div>
              </div>
            </div>
          </div>

          <div className="ef-scroll-body">
            <div className="ef-body">
              {hasParent && (
                <div className="ef-field">
                  <label className="ef-label" htmlFor="master-parent">{parentNoun}<span className="ef-required">*</span></label>
                  <select id="master-parent" className="ef-input" value={newStateId} onChange={(e) => setNewStateId(e.target.value)}>
                    <option value="">{`Select ${parentNoun.toLowerCase()}`}</option>
                    {(stateRows || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </select>
                </div>
              )}
              <div className={`ef-field${hasParent ? "" : " full"}`}>
                <label className="ef-label" htmlFor="master-name">{noun} name<span className="ef-required">*</span></label>
                <div ref={inputContainerRef} style={{ position: "relative", flex: 1, minWidth: 220 }}>
                  <input
                    id="master-name"
                    className="ef-input"
                    type="text"
                    placeholder={`Type to search or add new ${label.replace(" Master", "").toLowerCase()}...`}
                    value={newName}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setShowSuggestions(true);
                      setActiveSuggestionIdx(-1);
                    }}
                    onKeyDown={(e) => {
                      if (showSuggestions && suggestions.length > 0) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveSuggestionIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveSuggestionIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                        } else if (e.key === "Enter" && activeSuggestionIdx >= 0) {
                          e.preventDefault();
                          handleSelectSuggestion(suggestions[activeSuggestionIdx]);
                        } else if (e.key === "Escape") {
                          setShowSuggestions(false);
                        }
                      }
                    }}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        background: "var(--color-surface-card, #ffffff)",
                        border: "1px solid var(--color-border, #cbd5e1)",
                        borderRadius: 10,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        maxHeight: 230,
                        overflowY: "auto",
                        zIndex: 100,
                        padding: "4px 0"
                      }}
                    >
                      <div style={{ padding: "4px 12px 6px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", tracking: "0.05em", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}>
                        Matching Suggestions
                      </div>
                      {suggestions.map((item, idx) => {
                        const isActive = idx === activeSuggestionIdx;
                        return (
                          <div
                            key={`${item.name}-${item.stateName || item.departmentName || idx}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(item);
                            }}
                            onMouseEnter={() => setActiveSuggestionIdx(idx)}
                            style={{
                              padding: "8px 12px",
                              fontSize: 13,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: isActive ? "var(--color-surface-hover, #f1f5f9)" : "transparent",
                              color: "var(--color-text-primary)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {isCityMaster ? <MapPin size={13} style={{ color: "#3b82f6" }} /> : <Search size={13} style={{ color: "#64748b" }} />}
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                              {(item.stateName || item.departmentName) && (
                                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                                  ({item.stateName || item.departmentName})
                                </span>
                              )}
                            </div>

                            {item.isAdded ? (
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "#dcfce7", color: "#166534" }}>
                                ✓ In Database
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1" }}>
                                + Select
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isCityMaster && newStateId && newName && rows.some((row) => row.stateId === Number(newStateId) && row.name.toLowerCase() === newName.toLowerCase()) && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, padding: "6px 12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 12, color: "#92400e", zIndex: 10 }}>
                      ⚠️ This city already exists in the selected state
                    </div>
                  )}
                  {isRoleMaster && newStateId && newName && rows.some((row) => row.departmentId === Number(newStateId) && row.name.toLowerCase() === newName.toLowerCase()) && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, padding: "6px 12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 12, color: "#92400e", zIndex: 10 }}>
                      ⚠️ This role already exists in the selected department
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ef-footer">
            <span className="ef-footer-note"><span className="ef-required">*</span> Required fields</span>
            <div className="ef-actions">
              <button type="button" className="ef-btn-secondary" onClick={closeAdd}>Cancel</button>
              <button className="primary" type="submit" disabled={saving}>
                <Plus size={16} /> {saving ? "Saving..." : `Save ${noun.toLowerCase()}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page-with-title-row" style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.history.back()} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>{label}</h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="search-bar" style={{ width: 320, margin: 0 }}>
            <Search size={16} className="text-slate-400" />
            <input placeholder={`Search ${noun.toLowerCase()}...`} value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="primary" onClick={() => { setError(null); setShowAdd(true); }}>＋ Add</button>
        </div>
      </div>
      <div className="card page-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>

        {error && <div className="fb-notice error" style={{ marginBottom: 12 }}>{error}</div>}

        {filteredRows.length === 0 ? (
          <div className="no-results">
            {isCityMaster ? <MapPin size={64} /> : <Search size={64} />}
            <h3>No records found</h3>
            <p>{search ? "Try adjusting your search." : `Click Add to create the first ${noun.toLowerCase()}.`}</p>
          </div>
        ) : (
          <div className="data-table-shell" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="data-table-region" style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
              <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 70 }}>#</th>
                    {hasParent && <th style={{ textAlign: "center", background: "var(--color-surface)" }}>{parentNoun}</th>}
                    <th style={{ textAlign: "center", background: "var(--color-surface)", cursor: "pointer", userSelect: "none" }} onClick={() => { setSortDir((d) => (d === "asc" ? "desc" : "asc")); setCurrentPage(1); }}>
                      Name<span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? " ▲" : " ▼"}</span>
                    </th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, i) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center", color: "var(--color-text-muted)" }}>{(safeCurrentPage - 1) * pageSize + i + 1}</td>
                      {hasParent && (
                        <td style={{ textAlign: "center" }}>
                          {editId === row.id ? (
                            <select className="ef-input" value={editStateId} onChange={(e) => setEditStateId(e.target.value)} style={{ padding: "5px 10px" }}>
                              <option value="">{`Select ${parentNoun.toLowerCase()}`}</option>
                              {(stateRows || []).map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
                            </select>
                          ) : (isCityMaster ? (row.stateName || "—") : (row.departmentName || "—"))}
                        </td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        {editId === row.id ? (
                          <input
                            autoFocus
                            className="ef-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") save(row.id); if (e.key === "Escape") setEditId(null); }}
                            style={{ padding: "5px 10px" }}
                          />
                        ) : <strong>{row.name}</strong>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                          {editId === row.id ? (
                            <>
                              <button type="button" className="row-action-btn view" aria-label="Save" title="Save" onClick={() => save(row.id)}><Check size={14} /></button>
                              <button type="button" className="row-action-btn delete" aria-label="Cancel" title="Cancel" onClick={() => setEditId(null)}><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="row-action-btn edit" aria-label={`Edit ${row.name}`} title="Edit" onClick={() => { setEditId(row.id); setEditName(row.name); setEditStateId(String((isCityMaster ? row.stateId : row.departmentId) || "")); }}><Pencil size={14} /></button>
                              <button type="button" className="row-action-btn delete" aria-label={`Delete ${row.name}`} title="Delete" onClick={() => remove(row.id)}><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-controls data-table-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 0", marginTop: 8, borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Per Page</span>
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Page {totalPages}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total {noun} {filteredRows.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="primary" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{ opacity: safeCurrentPage <= 1 ? 0.5 : 1 }}>Previous</button>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Page</span>
                  <select value={safeCurrentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button className="primary" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: safeCurrentPage >= totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings({ activeMaster, auth }) {
  const active = activeMaster || SETTINGS_MASTERS[0].key;

  if (active === "form-master") {
    return (
      <>
        <FormMaster auth={auth} />
      </>
    );
  }

  const current = SETTINGS_MASTERS.find((m) => m.key === active);

  return <MasterTable key={active} masterKey={active} label={current.label} />;
}

export default Settings;
