import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { nav, SETTINGS_MASTERS } from "../config";
import {
  Bell, Moon, Sun, Menu, ChevronLeft, LogOut, User,
  ChevronDown, Maximize, Minimize, Users, UserRound, ClipboardList, ListChecks, Settings as SettingsIcon
} from "lucide-react";
import { isAdminUser } from "../utils/employeeForms";
import { GlobalSettingsProvider } from "../context/GlobalSettingsContext";
import Profile from "./Profile";
import FormBuilder from "./FormBuilder";
import FormResponses from "./FormResponses";
import AssignedForms from "./AssignedForms";
import UsersPage from "./Users";
import Settings from "./Settings";

const iconMap = {
  Users,
  UserRound,
  ClipboardList,
  ListChecks,
  Settings: SettingsIcon,
};

function Console({ auth, logout }) {
  const [page, setPage] = useState("users"),
    [data, setData] = useState({}),
    [add, setAdd] = useState(false),
    [record, setRecord] = useState(null),
    [profileMenu, setProfileMenu] = useState(false),
    [notifMenu, setNotifMenu] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [darkMode, setDarkMode] = useState(() =>
      localStorage.getItem("dashboardTheme") === "dark"
    ),
    [, setPageHistory] = useState(["users"]),
    [loading, setLoading] = useState(false),
    [hoveredNav, setHoveredNav] = useState(null),
    [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 }),
    [tooltipAlign, setTooltipAlign] = useState("center"),
    [scrolled, setScrolled] = useState(false),
    [isFullscreen, setIsFullscreen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [settingsMaster, setSettingsMaster] = useState(SETTINGS_MASTERS[0].key);

  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const sectionRef = useRef(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dashboardTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dashboardTheme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenu, notifMenu]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const handleScroll = () => setScrolled(section.scrollTop > 20);
    section.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => section.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const load = async (specificKey = "employees") => {
    setLoading(true);
    try {
      if (specificKey === "employees") {
        setData((prev) => ({ ...prev, employees: [] }));
      }
    } catch (error) {
      console.error("[Console.load] Failed to load portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("employees");
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const validPages = nav
      .filter(([, , , access]) => access === "admin" ? isAdminUser(auth.user) : access === "employee" ? !isAdminUser(auth.user) : true)
      .map(([key]) => key);
    if (hash && validPages.includes(hash)) {
      setPage(hash);
      setPageHistory((prev) => [...prev, hash]);
      if (hash === "settings") setSettingsOpen(true);
    }
    // Only resolve the initial hash on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fix 2: Browser back button navigation
  useEffect(() => {
    const handlePopState = () => {
      const state = window.history.state;
      if (state?.type === "record") {
        setRecord(null);
        setAdd(false);
        setProfileMenu(false);
        setNotifMenu(false);
        return;
      }

      setPageHistory((prev) => {
        if (prev.length > 1) {
          const newHistory = [...prev];
          newHistory.pop(); // Remove current page
          const previousPage = newHistory[newHistory.length - 1] || "dashboard";
          setPage(previousPage);
          setAdd(false);
          setRecord(null);
          setProfileMenu(false);
          setNotifMenu(false);
          load(previousPage);
          return newHistory;
        }
        return prev;
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

const navigate = (key) => {
    window.history.pushState({ page: key, type: "page" }, "", `#${key}`);
    setPageHistory((prev) => [...prev, key]);
    setPage(key);
    setAdd(false);
    setRecord(null);
    setProfileMenu(false);
    setNotifMenu(false);
  };

  const visibleNav = nav.filter(([, , , access]) => access === "admin" ? isAdminUser(auth.user) : access === "employee" ? !isAdminUser(auth.user) : true);

  const userInitials = auth.user.fullName
    ? auth.user.fullName
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
    : "U";
  return (
    <GlobalSettingsProvider>
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />

      {/* Sidebar */}
      <aside className={collapsed ? "collapsed" : ""}>
        <div className="brand">
          <div className="brand-logo">C</div>
          <div className="brand-text">
            <b>Company Dashboard</b>
            <small>Enterprise console</small>
          </div>
        </div>

        <span className="sidebar-label">Main</span>

        <nav className="sidebar-nav">
          {visibleNav.map(([key, iconName, name]) => {
            const Icon = iconMap[iconName] || Users;

            if (key === "settings") {
              return (
                <div key={key}>
                  <button
                    className={page === "settings" ? "active" : ""}
                    onClick={() => setSettingsOpen((open) => !open)}
                    onMouseEnter={(e) => {
                      if (!collapsed) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ top: rect.top - 36, left: rect.left + rect.width / 2 });
                      setTooltipAlign("center");
                      setHoveredNav(name);
                    }}
                    onMouseLeave={() => { setHoveredNav(null); setTooltipAlign("center"); }}
                  >
                    <span className="nav-icon"><Icon size={18} /></span>
                    <span className="nav-text">{name}</span>
                    <ChevronDown size={14} className={`settings-chevron${settingsOpen ? " open" : ""}`} />
                  </button>
                  {settingsOpen && (
                    <div className="master-submenu">
                      {SETTINGS_MASTERS.map((master) => (
                        <button
                          key={master.key}
                          className={page === "settings" && settingsMaster === master.key ? "active" : ""}
                          onClick={() => {
                            setSettingsMaster(master.key);
                            navigate("settings");
                          }}
                        >
                          {master.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={key}
                className={page === key ? "active" : ""}
                onClick={() => navigate(key)}
                onMouseEnter={(e) => {
                  if (!collapsed) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ top: rect.top - 36, left: rect.left + rect.width / 2 });
                  setTooltipAlign("center");
                  setHoveredNav(name);
                }}
                onMouseLeave={() => { setHoveredNav(null); setTooltipAlign("center"); }}
              >
                <span className="nav-icon"><Icon size={18} /></span>
                <span className="nav-text">{name}</span>
              </button>
            );
          })}
        </nav>


        <div className="sidebar-footer">
          &copy; {new Date().getFullYear()} Company Dashboard
        </div>
      </aside>

      {/* Sidebar Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={16}
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* Main Content */}
      <main>
        {/* Top Navbar */}
        <header className={`top-navbar${scrolled ? " scrolled" : ""}`}>
          <div className="navbar-left">
            <button
              className="navbar-icon-btn menu-toggle"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={18} />
            </button>
            <span className="navbar-page-title">
              {page === "profile"
                ? "Profile"
                : page === "form-builder"
                  ? "Form Builder"
                  : page === "settings"
                    ? "Settings"
                  : page[0].toUpperCase() + page.slice(1)}
            </span>
          </div>

          <div className="navbar-actions">
            {/* Dark/Light Mode Toggle */}
            <button
              className="navbar-icon-btn"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              className="navbar-icon-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit full screen (F11)" : "Full screen (F11)"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            {/* Notifications */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={notifMenuRef}>
              <button
                className="navbar-icon-btn"
                onClick={() => {
                  setNotifMenu(!notifMenu);
                  setProfileMenu(false);
                }}
              >
                <Bell size={18} />
                <span className="notification-dot" />
              </button>
              {notifMenu && (
                <div className="dropdown-menu" style={{ width: 260 }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)" }}>
                    <strong style={{ fontSize: 13 }}>Notifications</strong>
                  </div>
                  <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                    No new notifications
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="user-menu" ref={profileMenuRef}>
              <button
                className="user-menu-btn"
                onClick={() => {
                  setProfileMenu(!profileMenu);
                  setNotifMenu(false);
                }}
              >
                <span className="user-avatar">{userInitials}</span>
                <span>{auth.user.fullName}</span>
                <ChevronDown size={14} />
              </button>
              {profileMenu && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => {
                      navigate("profile");
                    }}
                  >
                    <User size={15} />
                    My profile
                  </button>
                  <button onClick={logout}>
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section ref={sectionRef} className="section-content">
          {loading ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: 300, gap: 12 }}>
              <div className="spinner" />
              <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading portal...</div>
            </div>
          ) : page === "profile" ? (
            <Profile auth={auth} onSaved={load} />
          ) : page === "users" ? (
            <UsersPage
              list={[]}
              employees={[]}
              add={add}
              setAdd={setAdd}
              setRecord={setRecord}
              record={record}
              remove={null}
              load={load}
            />
          ) : page === "form-builder" ? (
            <FormBuilder auth={auth} />
          ) : page === "settings" ? (
            <Settings auth={auth} activeMaster={settingsMaster} />
          ) : page === "form-responses" ? (
            <FormResponses auth={auth} />
          ) : page === "assigned-forms" ? (
            <AssignedForms auth={auth} />
          ) : (
            <UsersPage
              list={[]}
              employees={[]}
              add={add}
              setAdd={setAdd}
              setRecord={setRecord}
              record={record}
              remove={null}
              load={load}
            />
          )}
        </section>
      </main>
      {typeof document !== "undefined" && createPortal(
        collapsed && hoveredNav ? (
          <div style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: tooltipAlign === "right" ? "translateY(-50%)" : "translateX(-50%)",
            background: "#1e293b",
            color: "#f8fafc",
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            zIndex: 99999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.1)",
            pointerEvents: "none",
          }}>
            {hoveredNav}
          </div>
        ) : null,
        document.body
      )}
    </div>
    </GlobalSettingsProvider>
  );
}

export default Console;

