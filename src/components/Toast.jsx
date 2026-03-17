import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error", 5000),
    info: (msg) => show(msg, "info"),
    warning: (msg) => show(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-slide-in
              ${t.type === "success" ? "bg-green-600" : ""}
              ${t.type === "error" ? "bg-red-600" : ""}
              ${t.type === "warning" ? "bg-yellow-500" : ""}
              ${t.type === "info" ? "bg-blue-600" : ""}
            `}
          >
            <span className="mt-0.5 shrink-0">
              {t.type === "success" && "✓"}
              {t.type === "error" && "✕"}
              {t.type === "warning" && "⚠"}
              {t.type === "info" && "ℹ"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
