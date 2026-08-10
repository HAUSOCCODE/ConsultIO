import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);
const MAX_TOASTS = 5;
const durations = { success: 3500, info: 4000, warning: 4500, error: 5500 };
const styles = {
  success: {
    icon: CheckCircle2,
    card: "border-green-200 bg-green-50 text-green-950",
    iconColor: "text-green-700",
  },
  error: {
    icon: XCircle,
    card: "border-red-200 bg-red-50 text-red-950",
    iconColor: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    card: "border-amber-200 bg-amber-50 text-amber-950",
    iconColor: "text-amber-700",
  },
  info: {
    icon: Info,
    card: "border-blue-200 bg-blue-50 text-blue-950",
    iconColor: "text-blue-700",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast,
      ),
    );
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      220,
    );
  }, []);

  const show = useCallback(
    (type, message, options = {}) => {
      const cleanMessage = String(message || "").trim();
      if (!cleanMessage) return null;
      const createdId = ++nextId.current;
      setToasts((current) => {
        if (
          current.some(
            (toast) =>
              !toast.leaving &&
              toast.type === type &&
              toast.message === cleanMessage,
          )
        )
          return current;
        return [
          ...current.slice(-(MAX_TOASTS - 1)),
          { id: createdId, type, message: cleanMessage, leaving: false },
        ];
      });
      window.setTimeout(
        () => dismiss(createdId),
        options.duration ?? durations[type] ?? durations.info,
      );
      return createdId;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      warning: (message, options) => show("warning", message, options),
      info: (message, options) => show("info", message, options),
      dismiss,
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-20 z-[11000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-24"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => {
          const appearance = styles[item.type] || styles.info;
          const Icon = appearance.icon;
          return (
            <div
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex min-w-0 items-start gap-3 rounded-xl border p-4 shadow-xl ${appearance.card} ${item.leaving ? "toast-exit" : "toast-enter"}`}
            >
              <Icon
                size={20}
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${appearance.iconColor}`}
              />
              <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-5">
                {item.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Close notification"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
              >
                <X size={17} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}
