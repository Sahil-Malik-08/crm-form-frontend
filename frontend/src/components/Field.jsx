function Field({ label, value, change, type = "text", disabled = false, required = true, options = [], placeholder = `Select ${String(label || "").toLowerCase()}`, autoComplete, readOnly = false, onFocus }) {
  const isPhone = /phone/i.test(label);
  if (type === "select") {
    return (
      <label className="field">
        <span>{label}{required && <span className="required-marker" aria-label="required"> *</span>}</span>
        <select
          value={value || ""}
          required={required}
          disabled={disabled}
          onChange={(e) => change(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) =>
            typeof opt === "object" ? (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ) : (
              <option key={opt} value={opt}>{opt}</option>
            ),
          )}
        </select>
      </label>
    );
  }
  return (
    <label className="field">
      <span>{label}{required && <span className="required-marker" aria-label="required"> *</span>}</span>
      <input
        type={isPhone ? "tel" : type}
        required={required}
        value={value || ""}
        disabled={disabled}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onFocus={onFocus}
        inputMode={isPhone ? "numeric" : undefined}
        maxLength={isPhone ? 10 : undefined}
        pattern={isPhone ? "[0-9]{10}" : undefined}
        title={isPhone ? "Enter exactly 10 digits." : undefined}
        onChange={(e) => change(isPhone ? e.target.value.replace(/\D/g, "") : e.target.value)}
      />
    </label>
  );
}

export default Field;

