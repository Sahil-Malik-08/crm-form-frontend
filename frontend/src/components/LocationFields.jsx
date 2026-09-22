import { useState, useEffect, useMemo } from "react";
import { fetchStates, fetchCities } from "../utils/masterData";
import { useMasters } from "../hooks/useMasters";

/**
 * LocationFields — a pair of searchable State + dependent City dropdowns.
 * Selecting a State clears the City and re-enables the City field.
 */
function LocationFields({
  state,
  city,
  onStateChange,
  onCityChange,
  onPincodeChange,
  stateLabel = "State",
  cityLabel = "City",
}) {
  const masters = useMasters(["cities", "states"]);
  const [apiStates, setApiStates] = useState([]);

  useEffect(() => {
    fetchStates().then(setApiStates).catch(() => {});
  }, []);

  const stateOptions = useMemo(() => {
    const dbStates = (masters.states || []).map((s) => s.name);
    const apiStateNames = (apiStates || []).map((s) => s.name);
    const combined = Array.from(new Set([...apiStateNames, ...dbStates]));
    return combined.map((s) => ({ value: s, label: s }));
  }, [masters.states, apiStates]);

  const cityOptions = useMemo(() => {
    if (!state) return [];
    const stateObj = apiStates.find((s) => s.name.toLowerCase() === String(state).toLowerCase());
    const staticCities = stateObj
      ? (masters.cities || [])
          .filter((c) => String(c.stateId) === String(stateObj.id))
          .map((c) => c.name)
      : [];

    const dbCities = (masters.cities || [])
      .filter((c) => (c.stateName || "").toLowerCase() === String(state).toLowerCase())
      .map((c) => c.name);

    const combined = Array.from(new Set([...staticCities, ...dbCities]));
    return combined.map((c) => ({ value: c, label: c }));
  }, [state, masters.cities, apiStates]);

  const handleStateChange = (value) => {
    onStateChange(value);
    onCityChange(""); // Clear city when state changes
    onPincodeChange && onPincodeChange(""); // Clear pincode when state changes
  };

  const handleCityChange = (value) => {
    onCityChange(value);
    onPincodeChange && onPincodeChange("");
  };

  const inputStyle = (value) => ({
    width: "100%", marginTop: 6, padding: 9,
    border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7,
    background: "var(--color-surface-card, #fff)",
    color: value ? "var(--color-text-primary)" : "var(--color-text-muted)",
    font: "inherit"
  });

  return (
    <>
      <label>
        {stateLabel}<span className="required-marker" aria-label="required"> *</span>
        <select value={state || ""} onChange={(e) => handleStateChange(e.target.value)} style={inputStyle(state)}>
          <option value="">Select state</option>
          {stateOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
      <label>
        {cityLabel}<span className="required-marker" aria-label="required"> *</span>
        <select value={city || ""} onChange={(e) => handleCityChange(e.target.value)} disabled={!state} style={inputStyle(city)}>
          <option value="">{state ? "Select city" : "Select state first"}</option>
          {cityOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
    </>
  );
}

export default LocationFields;
