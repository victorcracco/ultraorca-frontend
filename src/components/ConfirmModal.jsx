import React from "react";

/**
 * Modal de confirmação para substituir window.confirm() nativo.
 * Uso: <ConfirmModal open={open} message="..." onConfirm={fn} onCancel={fn} />
 */
export default function ConfirmModal({ open, message, onConfirm, onCancel, confirmLabel = "Confirmar", danger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <p className="text-gray-800 font-medium text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-white transition
              ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
