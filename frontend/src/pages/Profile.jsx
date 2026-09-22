import { useState, useEffect, useMemo, useRef } from "react";
import { API, request, toTitleCase } from "../config";
import { useMasters } from "../hooks/useMasters";
import { formatDate } from "../utils/dateTime";

function getRolesForDepartmentFromApi(departmentName, allRoles, allDepartments) {
  if (!departmentName || !allRoles || !allDepartments) return [];
  const dept = allDepartments.find((d) => d.name.toLowerCase() === departmentName.toLowerCase());
  if (!dept) return [];
  return allRoles
    .filter((r) => String(r.departmentId) === String(dept.id))
    .map((r) => r.name);
}

function Profile({ auth }) {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const imageInputRef = useRef(null);
  const headers = useMemo(() => ({ Authorization: `Bearer ${auth.token}` }), [auth.token]);
  const masters = useMasters(["departments", "roles"]);

  const availableRoles = useMemo(() => {
    if (!form.department) return [];
    const names = getRolesForDepartmentFromApi(form.department, masters.roles || [], masters.departments || []);
    const roleMap = new Map((masters.roles || []).map((role) => [role.name.toLowerCase(), role]));
    const options = names.map((name) => roleMap.get(name.toLowerCase()) || { id: name, name });
    const currentRole = form.designation || form.role;
    if (currentRole && !options.some((role) => role.name.toLowerCase() === currentRole.toLowerCase())) {
      options.unshift({ id: currentRole, name: currentRole });
    }
    return options;
  }, [form.department, form.designation, form.role, masters.roles, masters.departments]);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
const load = async () => {
      try {
        const r = await request("/auth/profile", { headers });
        if (r.status === 401) {
          setLoadError("Session expired. Please sign in again.");
          return;
        }
        if (!r.ok) {
          setLoadError("Failed to load profile.");
          return;
        }
        const p = await r.json();
        setProfile(p);
        setForm(p);
      } catch {
        setLoadError("Could not connect to server. Make sure the backend is running.");
      }
    };
    load();
  }, [headers]);

  const getInitials = (name) => {
    if (!name) return "E";
    const names = name.trim().split(" ");
    let initials = names[0]?.charAt(0)?.toUpperCase() || "E";
    if (names.length > 1) initials += names[names.length - 1]?.charAt(0)?.toUpperCase() || "";
    return initials;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage('Choose a JPG, PNG, or WEBP image smaller than 2 MB.');
      setMessageType('error');
      e.target.value = '';
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

const save = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.fullName) {
      setMessage("Full name is required.");
      setMessageType("error");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setMessage("Phone number must contain exactly 10 digits.");
      setMessageType("error");
      return;
    }

// For simplicity, use JSON for text + send image separately if needed
    const body = {
      fullName: form.fullName,
      username: form.username || profile.username,
      email: form.email || null,
      phone: form.phone || null,
      department: form.department || null,
      designation: form.designation || null,
      address: form.address || null,
    };
    const r = await request("/auth/profile", {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const v = await r.json();
    if (!r.ok) {
      setMessage(v.message);
      setMessageType("error");
      return;
    }
    let updatedProfile = { ...profile, ...v };
    if (imageFile) {
      const photoData = new FormData();
      photoData.append('photo', imageFile);
      const uploadResponse = await fetch(`${API}/auth/profile/photo`, {
        method: 'POST',
        headers,
        body: photoData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setMessage(uploadResult.message || 'Photo upload failed.');
        setMessageType('error');
        return;
      }
      updatedProfile = { ...updatedProfile, profileImage: uploadResult.profileImage };
    }
    setProfile(updatedProfile);
    setEdit(false);
    setMessage("Profile updated successfully.");
    setMessageType("success");
    setImagePreview(null);
    setImageFile(null);
  };

  if (loadError) return <div className="notice" style={{ margin: 20 }}>{loadError}</div>;
  if (!profile) return <p>Loading profile…</p>;

  return (
    <div className="profile-page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="card profile-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Gradient Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          padding: 30,
          display: "flex",
          alignItems: "center",
          gap: 20,
          color: "#fff",
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "#fff",
            border: "4px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            overflow: "hidden", flexShrink: 0,
          }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              getInitials(profile.fullName)
            )}
          </div>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>{toTitleCase(profile.fullName)}</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1" }}>
              {profile.department || "Employee"} • ID: #{profile.id}
            </p>
          </div>
        </div>

        <div style={{ padding: 30 }}>
          {message && (
            <div style={{
              padding: "12px 16px", borderRadius: 6, marginBottom: 20, fontSize: 14,
              backgroundColor: messageType === "success" ? "#d1fae5" : "#fee2e2",
              color: messageType === "success" ? "#065f46" : "#991b1b",
              border: `1px solid ${messageType === "success" ? "#a7f3d0" : "#fca5a5"}`,
            }}>
              {message}
            </div>
          )}

          {edit ? (
            /* Edit Mode */
            <form onSubmit={save}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Profile Image
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: "50%",
                    overflow: "hidden", border: "2px solid #cbd5e1",
                    backgroundColor: "#f1f5f9", flexShrink: 0,
                  }}>
                    <img
                      src={imagePreview || profile.profileImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Crect fill='%23f1f5f9' width='70' height='70'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' fill='%2394a3b8' font-size='24' font-weight='bold'%3E%3F%3C/text%3E%3C/svg%3E"}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input ref={imageInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} style={{ display: "none" }} />
                    <button type="button" className="primary" onClick={() => imageInputRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      Choose photo
                    </button>
                    <small style={{ color: "#64748b", display: "block", marginTop: 8 }}>{imageFile ? imageFile.name : "JPG, PNG, or WEBP • Maximum 2 MB"}</small>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Full Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input type="text" value={form.fullName || ""} required
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Email <span style={{ color: "red" }}>*</span>
                  </label>
                  <input type="email" value={form.email || ""} required
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Phone Number</label>
                  <input type="tel" inputMode="numeric" pattern="[0-9]{10}" title="Enter exactly 10 digits." value={form.phone || ""} maxLength={10}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Department</label>
                  <select value={form.department || ""}
                    onChange={(e) => setForm({ ...form, department: e.target.value, designation: "" })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "var(--color-surface-card, #fff)", color: form.department ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    <option value="">Select department</option>
                    {(masters.departments || []).map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Role</label>
                  <select value={form.designation || form.role || ""} disabled={!form.department}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "var(--color-surface-card, #fff)", color: (form.designation || form.role) ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    <option value="">{form.department ? "Select role" : "Select department first"}</option>
                    {availableRoles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Address</label>
                  <textarea value={form.address || ""} rows={2}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
                <button type="button" onClick={() => { setEdit(false); setForm(profile); setImagePreview(null); setImageFile(null); setMessage(""); }}
                  style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "10px 22px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Update Profile
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-view-heading">
                <div><span>Overview</span><h3>Account details</h3><p>Your personal and workplace information.</p></div>
                <button className="primary" onClick={() => setEdit(true)}>Edit profile</button>
              </div>
              <div className="profile-summary-grid">
                <section><h4>Contact information</h4><dl>
                  <div><dt>Full name</dt><dd>{toTitleCase(profile.fullName)}</dd></div>
                  <div><dt>Email address</dt><dd>{profile.email || "Not provided"}</dd></div>
                  <div><dt>Phone number</dt><dd>{profile.phone || "Not provided"}</dd></div>
                  <div><dt>Address</dt><dd>{profile.address || "Not provided"}</dd></div>
                </dl></section>
                <section><h4>Work information</h4><dl>
                  <div><dt>Employee ID</dt><dd>#{profile.id}</dd></div>
                  <div><dt>Department</dt><dd>{profile.department || "Not assigned"}</dd></div>
                  <div><dt>Role</dt><dd>{profile.designation || profile.role || "Employee"}</dd></div>
                  <div><dt>Joined</dt><dd>{profile.createdAt ? formatDate(profile.createdAt) : "Not available"}</dd></div>
                </dl></section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

