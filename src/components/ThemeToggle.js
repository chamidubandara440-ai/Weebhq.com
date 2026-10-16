"use client";
import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return null;
}
