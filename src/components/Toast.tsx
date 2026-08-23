import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isError = toast.type === "error";

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
        isError
          ? "bg-red-50 border-red-200"
          : "bg-emerald-50 border-emerald-200"
      } ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
      )}
      <p className={`text-sm font-medium flex-1 ${isError ? "text-red-700" : "text-emerald-700"}`}>
        {toast.message}
      </p>
      <button onClick={onDismiss} className="p-0.5 hover:bg-black/5 rounded transition-colors shrink-0">
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  );
}
