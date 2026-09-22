import { useState } from "react";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import { CURRENCIES, MONTHS } from "../utils/settings";
import { Settings as SettingsIcon, DollarSign, Calendar, Save, RotateCcw, ArrowLeft } from "lucide-react";

function GlobalSettings() {
  const { settings, updateSettings } = useGlobalSettings();
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalSettings({ ...settings });
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Global Settings</h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Currency Setting */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <DollarSign size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Currency
            </h3>
          </div>
          <p style={{ margin: "0 0 12px 30px", color: "var(--color-text-muted)", fontSize: 13 }}>
            Select the default currency for displaying financial data across the application
          </p>
          <div style={{ marginLeft: 30 }}>
            <select
              value={localSettings.currency}
              onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "10px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 14,
                background: "var(--color-surface-card)",
                color: "var(--color-text-primary)",
                cursor: "pointer"
              }}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.label} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Year Setting */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Calendar size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Financial Year
            </h3>
          </div>
          <p style={{ margin: "0 0 16px 30px", color: "var(--color-text-muted)", fontSize: 13 }}>
            Configure the financial year period for reporting and analytics
          </p>
          
          <div style={{ marginLeft: 30, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {/* Start Month */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>
                Start Month
              </label>
              <select
                value={localSettings.fyStartMonth}
                onChange={(e) => setLocalSettings({ ...localSettings, fyStartMonth: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 14,
                  background: "var(--color-surface-card)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* End Month */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>
                End Month
              </label>
              <select
                value={localSettings.fyEndMonth}
                onChange={(e) => setLocalSettings({ ...localSettings, fyEndMonth: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 14,
                  background: "var(--color-surface-card)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>
                Year
              </label>
              <input
                type="number"
                value={localSettings.fyYear}
                onChange={(e) => setLocalSettings({ ...localSettings, fyYear: Number(e.target.value) })}
                min="2000"
                max="2100"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 14,
                  background: "var(--color-surface-card)",
                  color: "var(--color-text-primary)"
                }}
              />
            </div>
          </div>

          {/* FY Preview */}
          <div style={{ marginLeft: 30, marginTop: 16, padding: 12, background: "var(--color-surface-hover)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", marginRight: 8 }}>Current Financial Year:</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {MONTHS[localSettings.fyStartMonth]} {localSettings.fyYear} – {MONTHS[localSettings.fyEndMonth]} {localSettings.fyEndMonth > localSettings.fyStartMonth ? localSettings.fyYear : localSettings.fyYear + 1}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginLeft: 30 }}>
          <button
            onClick={handleSave}
            className="primary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Save size={16} />
            {saved ? "Saved!" : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            className="secondary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalSettings;
