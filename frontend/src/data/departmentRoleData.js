export const departmentRoleData = {
  IT: [
    "System Administrator",
    "Network Engineer",
    "Network Administrator",
    "IT Support Specialist",
    "IT Project Manager",
    "IT Manager",
    "Cybersecurity Analyst",
    "Information Security Manager",
    "Database Administrator",
    "Cloud Engineer",
    "Cloud Architect",
    "Technical Support Specialist",
    "Help Desk Analyst",
    "IT Consultant",
  ],
  Sales: [
    "Sales Executive",
    "Sales Manager",
    "Business Development Manager",
    "Account Manager",
    "Sales Representative",
    "Regional Sales Manager",
    "Inside Sales Representative",
    "Sales Analyst",
    "Sales Coordinator",
    "Key Account Manager",
    "Territory Sales Manager",
    "Sales Engineer",
  ],
  Management: [
    "CEO",
    "COO",
    "CTO",
    "CFO",
    "General Manager",
    "Director",
    "Vice President",
    "Senior Manager",
    "Team Lead",
    "Assistant Vice President",
    "Regional Head",
    "Business Unit Head",
    "Managing Director",
    "President",
    "admin",
    "manager",
    "supervisor",
    "executive",
  ],
};

const toKey = (name) => String(name || "").trim().toLowerCase();

export function getRolesForDepartment(department, allRoles = []) {
  const deptKey = Object.keys(departmentRoleData).find(
    (key) => toKey(key) === toKey(department)
  );
  if (!deptKey) return (allRoles || []).map(({ name }) => name);
  const mapped = departmentRoleData[deptKey];
  const existing = (allRoles || []).filter(({ name }) =>
    mapped.some((r) => toKey(r) === toKey(name))
  );
  return existing.length > 0
    ? existing.map(({ name }) => name)
    : mapped;
}

export function getRolesForDepartments(departments = [], allRoles = []) {
  const names = new Set();
  (departments.length ? departments : Object.keys(departmentRoleData)).forEach((dept) => {
    getRolesForDepartment(dept, allRoles).forEach((name) => names.add(name));
  });
  return Array.from(names);
}
