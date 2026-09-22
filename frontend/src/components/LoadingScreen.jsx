import { useEffect, useState } from "react";

function LoadingScreen({ text = "Loading" }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-loader">
      <div className="loader-brand">
        <div className="loader-logo">C</div>
        <div className="loader-title">Company Dashboard</div>
      </div>
      <div className="spinner" />
      <div className="loader-text">
        {text}<span className="loader-dots">{dots}</span>
      </div>
    </div>
  );
}

export default LoadingScreen;
