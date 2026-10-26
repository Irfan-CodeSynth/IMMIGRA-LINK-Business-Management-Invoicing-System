import React, { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { alertService, AlertOptions } from "../../services/alertService";

export const AppAlertModal: React.FC = () => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  useEffect(() => {
    const unsubscribe = alertService.subscribe((newAlert) => {
      setAlert(newAlert);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && alert) {
        alertService.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alert]);

  if (!alert) return null;

  const type = alert.type || "error";

  const renderIcon = () => {
    switch (type) {
      case "error":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-navy flex items-center justify-center border border-blue-100 shadow-xs">
            <Info className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => alertService.close()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent strip */}
        <div
          className={`h-1.5 w-full ${
            type === "error"
              ? "bg-rose-500"
              : type === "warning"
              ? "bg-amber-500"
              : type === "success"
              ? "bg-emerald-500"
              : "bg-brand-navy"
          }`}
        />

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {renderIcon()}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  DeepX Invoice System
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {alert.title || "Notification"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alertService.close()}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 mb-5">
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {alert.message}
            </p>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              autoFocus
              onClick={() => alertService.close()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${
                type === "error"
                  ? "bg-brand-navy hover:bg-slate-900 text-white"
                  : type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-brand-navy hover:bg-slate-900 text-white"
              }`}
            >
              {alert.confirmText || "Understood"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
