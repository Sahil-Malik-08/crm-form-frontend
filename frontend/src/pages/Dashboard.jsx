import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, UserCheck, ShoppingCart, DollarSign, Clock, CheckCircle, TrendingUp, PlusCircle, UserPlus, BarChart3, Eye, ArrowUpRight } from "lucide-react";
import { StatsCard, ChartWidget, CardSkeleton, ChartSkeleton, TableSkeleton } from "../components";
import { request } from "../config";
import { toTitleCase } from "../config";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import { formatCurrency } from "../utils/settings";

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  orange: "#f97316",
  emerald: "#059669",
  red: "#ef4444",
  pink: "#ec4899"
};
const PIE_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444"
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function Dashboard({ dashboard, setPage, searchQuery = "" }) {
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [salesPeriod, setSalesPeriod] = useState("monthly");
  const [revenuePeriod, setRevenuePeriod] = useState("weekly");

  useEffect(() => {
    let active = true;
    Promise.all([
      request("/customers?limit=5&sortBy=id&sortDir=desc"),
      request("/employees?limit=5&sortBy=id&sortDir=desc"),
    ])
      .then(([custRes, empRes]) => Promise.all([custRes.json(), empRes.json()]))
      .then(([custData, empData]) => {
        if (!active) return;
        const customers = Array.isArray(custData) ? custData : custData.rows || [];
        const employees = Array.isArray(empData) ? empData : empData.rows || [];
        setRecentCustomers(customers);
        setRecentEmployees(employees);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!dashboard) {
    return (
      <div>
        <div className="welcome-banner bg-slate-200 dark:bg-slate-700 animate-pulse" style={{ height: 100, borderRadius: 16 }} />
        <div className="stats-grid">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="charts-row">
          {Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} height={280} />)}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm mb-7">
          <div className="w-40 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-4" />
          <TableSkeleton rows={5} cols={6} />
        </div>
      </div>
    );
  }

  const s = dashboard.stats || {};
  const matchesSearch = (record) => !searchQuery.trim() || Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const recentOrders = (dashboard.recentOrders || []).filter(matchesSearch);
  const bestSelling = (dashboard.bestSelling || []).filter(matchesSearch);
  const recentEmployeesList = (dashboard.employees || []).filter(matchesSearch).slice(0, 5);
  const recentCustomersList = (dashboard.customers || []).filter(matchesSearch).slice(0, 5);
  const monthlyData = dashboard.monthlySales || [];
  const revenueData = dashboard.weeklyRevenue || [];
  const statusData = dashboard.statusData || [];

  const statsCards = [
    { icon: Users, label: "Total Employees", value: s.employees || 0, color: "blue" },
    { icon: UserCheck, label: "Total Customers", value: s.customers || 0, color: "green" },
    { icon: ShoppingCart, label: "Total Orders", value: s.totalOrders || 0, color: "purple" },
    { icon: DollarSign, label: "Total Revenue", value: formatCurrency(s.totalRevenue || 0, { compact: true }), color: "amber" },
    { icon: Clock, label: "Pending Orders", value: s.pending || 0, color: "orange" },
    { icon: CheckCircle, label: "Completed Orders", value: s.completed || 0, color: "emerald" },
  ];

  const quickActions = [
    { icon: UserPlus, label: "Add Employee", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", textColor: "text-blue-600 dark:text-blue-400", action: () => setPage("employees") },
    { icon: PlusCircle, label: "Add Customer", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", textColor: "text-emerald-600 dark:text-emerald-400", action: () => setPage("customers") },
    { icon: ShoppingCart, label: "Create Order", color: "from-purple-500 to-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10", textColor: "text-purple-600 dark:text-purple-400", action: () => setPage("orders") },
    { icon: BarChart3, label: "View Reports", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-500/10", textColor: "text-amber-600 dark:text-amber-400", action: () => {} },
  ];
  const activitiesList = activities.length ? activities : [];

  return (
    <div>
      {/* Welcome Banner */}
      {/* <div className="welcome-banner">
        <div>
          <h1>Welcome back, {dashboard.user?.fullName?.split(" ")[0] || "Admin"}</h1>
          <p>Here is what is happening across your business today.</p>
        </div>
        <span className="welcome-badge">
          <TrendingUp size={14} style={{ display: "inline", marginRight: 4 }} />
          {(s.totalOrders || 0) > 0 ? "Active" : "No activity"} · Today
        </span>
      </div> */}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsCards.map((card, i) => <StatsCard key={i} {...card} />)}
      </div>

      {/* Quick Actions */}
      {/* <div className="quick-actions">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button key={i} className="quick-action-btn" onClick={action.action}>
              <div className={`qa-icon ${action.bg}`}>
                <Icon className={`w-5 h-5 ${action.textColor}`} />
              </div>
              {action.label}
            </button>
          );
        })}
      </div> */}

      {/* Charts Row */}
      <div className="charts-row">
        <ChartWidget 
          title="Sales" 
          subtitle="Orders and revenue from the database" 
          height={300}
          action={
            <div style={{ display: "flex", gap: 4 }}>
              <button 
                onClick={() => setSalesPeriod("monthly")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: 6, 
                  fontSize: 12, 
                  border: "1px solid var(--color-border)", 
                  background: salesPeriod === "monthly" ? "var(--color-primary)" : "var(--color-surface-card)",
                  color: salesPeriod === "monthly" ? "white" : "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setSalesPeriod("weekly")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: 6, 
                  fontSize: 12, 
                  border: "1px solid var(--color-border)", 
                  background: salesPeriod === "weekly" ? "var(--color-primary)" : "var(--color-surface-card)",
                  color: salesPeriod === "weekly" ? "white" : "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                Weekly
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="revenue" fill={COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWidget>

        <ChartWidget 
          title="Revenue Trend" 
          subtitle="Revenue from the database" 
          height={300}
          action={
            <div style={{ display: "flex", gap: 4 }}>
              <button 
                onClick={() => setRevenuePeriod("weekly")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: 6, 
                  fontSize: 12, 
                  border: "1px solid var(--color-border)", 
                  background: revenuePeriod === "weekly" ? "var(--color-primary)" : "var(--color-surface-card)",
                  color: revenuePeriod === "weekly" ? "white" : "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setRevenuePeriod("monthly")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: 6, 
                  fontSize: 12, 
                  border: "1px solid var(--color-border)", 
                  background: revenuePeriod === "monthly" ? "var(--color-primary)" : "var(--color-surface-card)",
                  color: revenuePeriod === "monthly" ? "white" : "var(--color-text-primary)",
                  cursor: "pointer"
                }}
              >
                Monthly
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.blue }} activeDot={{ r: 6 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWidget>

        <ChartWidget title="Order Status" subtitle="Current order distribution" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} formatter={(value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWidget>
      </div>

      {/* Recent Orders + Top Products Row */}
      <div className="widgets-row">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
          <div className="widget-header px-5 pt-5">
            <div>
              <h3>Recent Orders</h3>
              <p>{recentOrders.length} orders this period</p>
            </div>
            <button className="view-all-btn" onClick={() => setPage("orders")}>
              View all <ArrowUpRight size={12} style={{ display: "inline" }} />
            </button>
          </div>
          <div className="table-container px-5 pb-5">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td><span className="font-semibold text-slate-900 dark:text-white">#{o.id}</span></td>
                    <td>{o.customer}</td>
                    <td className="max-w-[120px] truncate">{o.product}</td>
                    <td><span className="font-semibold">₹{Number(o.amount).toLocaleString("en-IN")}</span></td>
                    <td><span className={`status-badge ${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                    <td className="text-slate-400">{o.date || "—"}</td>
                    <td>
                      <button className="row-action-btn view" onClick={() => setPage("orders")}>
                        <Eye size={12} style={{ display: "inline", marginRight: 3 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
          <div className="widget-header px-5 pt-5">
            <div>
              <h3>Top Selling Products</h3>
              <p>Best performers this period</p>
            </div>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {bestSelling.length > 0 ? bestSelling.slice(0, 6).map((item, i) => (
              <div key={i} className="top-product-row">
                <div className={`top-product-rank ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : i === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300" : i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                  {i + 1}
                </div>
                <div className="top-product-details">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.qtySold || 0} units sold</p>
                </div>
                <span className="top-product-revenue">₹{Number(item.revenue || 0).toLocaleString("en-IN")}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-sm text-slate-400">No product data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="widgets-bottom">
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'}>
          <div className="widget-header px-6 pt-6">
            <div>
              <h3>Recent Customers</h3>
              <p>Latest registered customers</p>
            </div>
            <button className="view-all-btn" onClick={() => setPage("customers")}>View all</button>
          </div>
          <div className="px-6 pb-6 space-y-2">
            {recentCustomersList.length > 0 ? (
              recentCustomersList.slice(0, 5).map((c, i) => (
                <div key={c.id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {(toTitleCase(c.name || "?")).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{toTitleCase(c.name || "—")}</p>
                    <p className="text-xs text-slate-400">{c.phone || c.city || "—"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">No customers yet</div>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'}>
          <div className="widget-header px-6 pt-6">
            <div>
              <h3>Recent Employees</h3>
              <p>Latest team members</p>
            </div>
            <button className="view-all-btn" onClick={() => setPage("employees")}>View all</button>
          </div>
          <div className="px-6 pb-6 space-y-2">
            {recentEmployeesList.length > 0 ? (
              recentEmployeesList.slice(0, 5).map((e, i) => (
                <div key={e.id || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {(toTitleCase(e.fullName || "?")).split(" ").map(x => x[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{toTitleCase(e.fullName || "—")}</p>
                    <p className="text-xs text-slate-400">{e.department || e.role || "Employee"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-slate-400">No employees yet</div>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'}>
          <div className="widget-header px-6 pt-6">
            <div>
              <h3>Today's Activity</h3>
              <p>Latest order activity</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="timeline">
              {activitiesList.length > 0 ? activitiesList.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${item.color}`} />
                  <span className="time">{item.time}</span>
                  <p className="event">{item.event}</p>
                </div>
              )) : (
                <div className="text-center py-6 text-sm text-slate-400">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
