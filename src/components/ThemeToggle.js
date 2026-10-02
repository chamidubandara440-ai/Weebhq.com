"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: "rgba(0,0,0,0.2)", 
        border: "1px solid rgba(255,255,255,0.4)", 
        color: "white", 
        padding: "3px 10px", 
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "15px",
        display: "flex",
        alignItems: "center",
        gap: "5px"
      }}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
