import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Pencil, Trash2, Plus, Check, X, Search, MapPin } from "lucide-react";
import { SETTINGS_MASTERS } from "../config";
import { fetchStates, fetchCities, fetchDepartments, fetchRoles, addMaster, updateMaster, deleteMaster } from "../utils/masterData";
import FormMaster from "./FormMaster";

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
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = { name: newName.trim() };
      if (isCityMaster) body.stateId = Number(newStateId);
      if (isRoleMaster) body.departmentId = Number(newStateId);
      await addMaster(masterKey, body);
      setNewName("");
      setNewStateId("");
      setShowSuggestions(false);
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

  return (
    <div>
      {error && (
        <div style={{ padding: "10px 14px", marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {(isCityMaster || isRoleMaster) && (
            <select required value={newStateId} onChange={(e) => setNewStateId(e.target.value)}
              style={{ minWidth: 190, padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: 8, font: "inherit", fontSize: 13, background: "var(--color-surface-card)", color: newStateId ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              <option value="">{isCityMaster ? "Select state" : "Select department"}</option>
              {(stateRows || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          )}

          <div ref={inputContainerRef} style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <input
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
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: 8, font: "inherit", fontSize: 13, background: "var(--color-surface-card)", color: "var(--color-text-primary)" }}
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

          <button className="primary" disabled={saving} type="submit" style={{ gap: 6, height: 36 }}>
            <Plus size={15} /> Add
          </button>
        </form>

      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>#</th>
              {(isCityMaster || isRoleMaster) && <th>{isCityMaster ? "State" : "Department"}</th>}
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={(isCityMaster || isRoleMaster) ? 4 : 3} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 24 }}>No records yet.</td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td style={{ width: 50, color: "var(--color-text-muted)" }}>{rows.length - i}</td>
                {(isCityMaster || isRoleMaster) && (
                  <td>
                    {editId === row.id ? (
                       <select value={editStateId} onChange={(e) => setEditStateId(e.target.value)}
                         style={{ width: "100%", padding: "5px 10px", border: "1px solid #3b82f6", borderRadius: 6, font: "inherit", fontSize: 13, background: "var(--color-surface-card)", color: editStateId ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                        <option value="">{isCityMaster ? "Select state" : "Select department"}</option>
                        {(stateRows || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                      </select>
                    ) : (isCityMaster ? (row.stateName || "—") : (row.departmentName || "—"))}
                  </td>
                )}
                <td>
                  {editId === row.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") save(row.id); if (e.key === "Escape") setEditId(null); }}
                      style={{ padding: "5px 10px", border: "1px solid #3b82f6", borderRadius: 6, font: "inherit", fontSize: 13, width: "100%", background: "var(--color-surface-card)", color: "var(--color-text-primary)" }}
                    />
                  ) : row.name}
                </td>
                <td>
                  <div className="row-actions">
                    {editId === row.id ? (
                      <>
                        <button className="row-action-btn view" onClick={() => save(row.id)}><Check size={13} /></button>
                        <button className="row-action-btn delete" onClick={() => setEditId(null)}><X size={13} /></button>
                      </>
                    ) : (
                      <>
                        <button className="row-action-btn edit" onClick={() => { setEditId(row.id); setEditName(row.name); setEditStateId(String((isCityMaster ? row.stateId : row.departmentId) || "")); }}><Pencil size={13} /></button>
                        <button className="row-action-btn delete" onClick={() => remove(row.id)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Settings({ activeMaster, auth }) {
  const active = activeMaster || SETTINGS_MASTERS[0].key;

  if (active === "form-master") {
    return (
      <>
        <div className="title">
          <div>
            <h1>Form Master</h1>
            <p>Manage master data for your organization.</p>
          </div>
        </div>
        <FormMaster auth={auth} />
      </>
    );
  }

  const current = SETTINGS_MASTERS.find((m) => m.key === active);

  return (
    <>
      <div className="title">
        <div>
          <h1>{current.label}</h1>
          <p>Manage master data for your organization.</p>
        </div>
      </div>
      <div className="card">
          <MasterTable key={active} masterKey={active} label={current.label} />
      </div>
    </>
  );
}

export default Settings;
