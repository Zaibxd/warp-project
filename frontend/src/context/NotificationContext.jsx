import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);
let notificationId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = "info", duration = 3000) => {
    const id = notificationId++;
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const showSuccess = useCallback((message) => showNotification(message, "success"), [showNotification]);
  const showError = useCallback((message) => showNotification(message, "error"), [showNotification]);
  const showInfo = useCallback((message) => showNotification(message, "info"), [showNotification]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      showNotification,
      showSuccess,
      showError,
      showInfo,
      removeNotification,
    }),
    [notifications, showNotification, showSuccess, showError, showInfo, removeNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
