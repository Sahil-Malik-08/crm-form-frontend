import { request } from "../config";

export async function fetchStates() {
  const r = await request("/settings/states");
  if (!r.ok) throw new Error("Failed to load states");
  return r.json();
}

export async function fetchCities(stateId) {
  const r = await request(`/settings/cities${stateId ? `?stateId=${stateId}` : ""}`);
  if (!r.ok) throw new Error("Failed to load cities");
  return r.json();
}

export async function fetchDepartments() {
  const r = await request("/settings/departments");
  if (!r.ok) throw new Error("Failed to load departments");
  return r.json();
}

export async function fetchRoles(departmentId) {
  const r = await request(`/settings/roles${departmentId ? `?departmentId=${departmentId}` : ""}`);
  if (!r.ok) throw new Error("Failed to load roles");
  return r.json();
}

export async function fetchIndustries() {
  const r = await request("/settings/industries");
  if (!r.ok) throw new Error("Failed to load industries");
  return r.json();
}

export async function addMaster(masterKey, body) {
  const r = await request(`/settings/${masterKey}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || `Failed to add ${masterKey}`);
  }
  return r.json();
}

export async function updateMaster(masterKey, id, body) {
  const r = await request(`/settings/${masterKey}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update ${masterKey}`);
  }
  return r.json();
}

export async function deleteMaster(masterKey, id) {
  const r = await request(`/settings/${masterKey}/${id}`, { method: "DELETE" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete ${masterKey}`);
  }
}
