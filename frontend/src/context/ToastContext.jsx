import { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const color =
    type === "success"
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className={`rounded-lg shadow-lg px-4 py-2 mb-2 ${color}`}
    >
      {message}
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const value = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
