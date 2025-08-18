import { createContext, useContext, useState, useCallback } from "react";
import "../styles/toast.css";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message, title = null) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastConfig = (type) => {
    const configs = {
      success: {
        headerClass: "toast-header-success",
        icon: "bi-check-circle-fill",
        textClass: "text-success",
        messageDefault: "Operación completada correctamente",
      },
      error: {
        headerClass: "toast-header-error",
        icon: "bi-x-circle-fill",
        textClass: "text-danger",
        messageDefault: "Por favor, inténtalo de nuevo",
      },
      info: {
        headerClass: "toast-header-info",
        icon: "bi-info-circle-fill",
        textClass: "text-primary",
        messageDefault: "Información importante",
      },
      warning: {
        headerClass: "toast-header-warning",
        icon: "bi-exclamation-triangle-fill",
        textClass: "text-warning",
        messageDefault: "Revisa los detalles",
      },
    };

    return configs[type] || configs.info;
  };

  const contextValue = {
    showSuccess: (msg, title = "Éxito") => showToast("success", msg, title),
    showError: (msg, title = "Error") => showToast("error", msg, title),
    showInfo: (msg, title = "Información") => showToast("info", msg, title),
    showWarning: (msg, title = "Advertencia") => showToast("warning", msg, title),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="custom-toast-container">
        {toasts.map(({ id, type, message, title }, index) => {
          const { headerClass, icon, textClass, messageDefault } = getToastConfig(type);

          return (
            <div
              key={id}
              className="toast show custom-toast"
              role="alert"
              style={{ transform: `translateY(${index * 10}px)`, zIndex: 1055 + index }}
            >
              <div className={`toast-header ${headerClass}`}>
                <i className={`bi ${icon} me-2`}></i>
                <strong className="me-auto">{title}</strong>
                <small>ahora</small>
                <button
                  type="button"
                  className={`btn-close ${type === "warning" ? "" : "btn-close-white"}`}
                  onClick={() => removeToast(id)}
                />
              </div>

              <div className="toast-body bg-light">
                <div className="d-flex align-items-center">
                  <i className={`bi ${icon} ${textClass} fs-4 me-3`} />
                  <div>
                    <div className="fw-bold">{message}</div>
                    <small className="text-muted">{messageDefault}</small>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
