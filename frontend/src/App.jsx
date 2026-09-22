import { useEffect, useState } from "react";
import "./App.css";
import { Auth, Console } from "./pages";
import { request } from "./config";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("companyDashboardAuth") || "null");
    } catch {
      return null;
    }
  });
  const [checking, setChecking] = useState(!!auth);

  useEffect(() => {
    if (!auth) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    request("/auth/profile", { signal: controller.signal })
      .then(async (r) => {
        clearTimeout(timeout);
        if (!active) return;
        if (!r.ok) {
          localStorage.removeItem("companyDashboardAuth");
          setAuth(null);
          return;
        }
        const profile = await r.json();
        setAuth((prev) => ({ ...prev, user: profile }));
      })
      .catch((error) => {
        clearTimeout(timeout);
        if (!active) return;
        console.error("Session verification failed:", error);
        localStorage.removeItem("companyDashboardAuth");
        setAuth(null);
      })
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return <LoadingScreen text="Verifying session" />;
  }

  if (!auth)
    return (
      <Auth
        onLogin={(value) => {
          localStorage.setItem("companyDashboardAuth", JSON.stringify(value));
          setAuth(value);
        }}
      />
    );
  return (
    <ErrorBoundary fallbackMessage="If this keeps happening, please refresh the page.">
      <Console
        auth={auth}
        logout={() => {
          localStorage.removeItem("companyDashboardAuth");
          setAuth(null);
        }}
      />
    </ErrorBoundary>
  );
}

export default App;


