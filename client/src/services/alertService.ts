export type AlertType = "error" | "warning" | "info" | "success";

export interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  onClose?: () => void;
}

type Listener = (alert: AlertOptions | null) => void;

let currentAlert: AlertOptions | null = null;
const listeners = new Set<Listener>();

export const alertService = {
  show: (options: AlertOptions | string, title?: string, type: AlertType = "error") => {
    if (typeof options === "string") {
      currentAlert = {
        message: options,
        title: title || (type === "error" ? "Action Blocked" : type === "warning" ? "Warning" : type === "success" ? "Success" : "Notice"),
        type,
      };
    } else {
      currentAlert = {
        title:
          options.title ||
          (options.type === "warning"
            ? "Warning"
            : options.type === "success"
            ? "Success"
            : options.type === "info"
            ? "Notice"
            : "Action Blocked"),
        type: options.type || "error",
        ...options,
      };
    }
    listeners.forEach((listener) => listener(currentAlert));
  },

  close: () => {
    if (currentAlert?.onClose) {
      try {
        currentAlert.onClose();
      } catch (e) {
        console.error("Error in alert onClose callback:", e);
      }
    }
    currentAlert = null;
    listeners.forEach((listener) => listener(null));
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(currentAlert);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const showAppAlert = alertService.show;
export const closeAppAlert = alertService.close;

// Safely intercept window.alert so that no native browser alert dialog can ever appear in the app
if (typeof window !== "undefined") {
  window.alert = (message?: any) => {
    const msg = message !== undefined && message !== null ? String(message) : "An unexpected event occurred.";
    alertService.show(msg, "Notice", "error");
  };
}
