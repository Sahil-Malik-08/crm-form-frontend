import { useState } from "react";
import { request } from "../config";
import { Field } from "../components";

function Auth({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [resetForm, setResetForm] = useState({ username: "", newPassword: "", confirmPassword: "" });
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        let message = "Sign in failed.";
        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          message = `Sign in failed (HTTP ${response.status}).`;
        }
        return setMessage(message);
      }
      const result = await response.json();
      onLogin(result);
    } catch (err) {
      setMessage(err.message || "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordReset = async (e) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      return setMessage("New passwords do not match.");
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ username: resetForm.username, newPassword: resetForm.newPassword }),
      });
      if (!response.ok) {
        let message = "Password reset failed.";
        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          message = `Password reset failed (HTTP ${response.status}).`;
        }
        return setMessage(message);
      }
      await response.json();
      setForm({ username: resetForm.username, password: "" });
      setResetMode(false);
      setMessage("Password updated. Sign in with your new password.");
    } catch (err) {
      setMessage(err.message || "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchToReset = () => {
    setResetForm({ username: form.username, newPassword: "", confirmPassword: "" });
    setResetMode(true);
    setMessage("");
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={resetMode ? submitPasswordReset : submit}>
        <div className="auth-logo">C</div>
        <h1>{resetMode ? "Reset password" : "Welcome back"}</h1>
        <p>{resetMode ? "Enter your username and choose a new password." : "Sign in to your company dashboard."}</p>
        <Field
          label="Username"
          type="text"
          value={resetMode ? resetForm.username : form.username}
          change={(value) => resetMode
            ? setResetForm({ ...resetForm, username: value })
            : setForm({ ...form, username: value })}
        />
        <Field
          label={resetMode ? "New password" : "Password"}
          type="password"
          value={resetMode ? resetForm.newPassword : form.password}
          change={(value) => resetMode
            ? setResetForm({ ...resetForm, newPassword: value })
            : setForm({ ...form, password: value })}
        />
        {resetMode && <Field
          label="Confirm new password"
          type="password"
          value={resetForm.confirmPassword}
          change={(value) => setResetForm({ ...resetForm, confirmPassword: value })}
        />}
        {!resetMode && <button className="text-button" type="button" onClick={switchToReset}>
          Forgot password?
        </button>}
        {message && <div className="notice">{message}</div>}
        <button className="primary wide" disabled={busy}>
          {busy ? "Please wait…" : resetMode ? "Reset password" : "Sign in"}
        </button>
        {resetMode && <div className="switch"><button type="button" onClick={() => { setResetMode(false); setMessage(""); }}>Back to sign in</button></div>}
      </form>
    </div>
  );
}

export default Auth;
