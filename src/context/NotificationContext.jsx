import {
  createContext, useContext, useState, useRef, useEffect, useCallback, useDeferredValue,
} from "react";
import { CheckCircle, XCircle, Bell, Info, AlertTriangle } from "lucide-react";
import {
  createNotifications, getNotificationsByUser, markNotificationAsRead, markNotificationAsView,
  saveNotificationsOffline, getNotificationsOfflineByUser, createNotificationOffline, getPendingNotificationsOffline,
} from "../services/dashboard/notificationsService";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const notificationRef = useRef(null);
  const isFetching = useRef(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const deferredNotifications = useDeferredValue(notifications);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const unreadCount = deferredNotifications.filter((n) => !n.leida).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        closeNotifications();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async (userId, isOffline) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      let data = [];
      if (isOffline) {
        const [offline, pending] = await Promise.all([
          getNotificationsOfflineByUser(userId),
          getPendingNotificationsOffline(userId),
        ]);
        data = [...pending, ...offline];
      } else {
        data = await getNotificationsByUser(userId);
        await saveNotificationsOffline(data);
        cleanupReadOverlayFromServer(data);
      }
      const readMap = getReadMap();
      const hidden = getHiddenNotifications();
      const withRead = data.map((n) =>
        readMap[n.notificacion_id] ? { ...n, leida: true } : n
      );
      const visible = withRead.filter((n) => !hidden.includes(n.notificacion_id));
      setNotifications(visible);
    } catch (err) {
      console.error("Error al obtener notificaciones:", err.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const createNotification = useCallback(async (data) => {
    try {
      if (!navigator.onLine) throw new Error("Sin conexión");
      const newNotif = await createNotifications(data);
      setNotifications((prev) => [newNotif, ...prev]);
    } catch {
      try {
        const timestamp = new Date().toISOString();
        const offlineNotif = {
          ...data,
          notificacion_id: `offline-${Date.now()}`,
          leida: false,
          fecha_creacion: timestamp,
        };
        await createNotificationOffline(offlineNotif);
        setNotifications((prev) => [offlineNotif, ...prev]);
      } catch (err) {
        console.error("Error al guardar notificación offline:", err.message);
      }
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Error al marcar como leída:", err.message);
    } finally {
      addReadLocal(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificacion_id === id ? { ...n, leida: true } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unread = deferredNotifications.filter((n) => !n.leida);
      await Promise.all(
        unread.map((n) =>
          markNotificationAsRead(n.notificacion_id).catch((err) =>
            console.error(`Error al marcar como leída ${n.notificacion_id}:`, err.message)
          )
        )
      );
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err.message);
    } finally {
      const unread = deferredNotifications.filter((n) => !n.leida);
      unread.forEach((n) => addReadLocal(n.notificacion_id));
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    }
  }, [deferredNotifications]);


  const deleteNotification = useCallback(async (id) => {
    try {
      await markNotificationAsView(id);
    } catch (err) {
      console.error("Error al marcar notificación como vista:", err.message);
    } finally {
      addHiddenLocal(id);
      setNotifications((prev) => prev.filter((n) => n.notificacion_id !== id));
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchTime < 450) return;
    setLastFetchTime(now);
    setShowNotifications((prev) => !prev);
  }, [lastFetchTime]);

  const openNotifications = useCallback(() => {
    setShowNotifications(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case "exito": return <CheckCircle size={18} className="text-success" />;
      case "alerta": return <AlertTriangle size={18} className="text-warning" />;
      case "error": return <XCircle size={18} className="text-danger" />;
      case "general": return <Info size={18} className="text-info" />;
      default: return <Bell size={18} className="text-muted" />;
    }
  };

  const getNotificationBadgeColor = (tipo) => {
    switch (tipo) {
      case "exito": return "bg-success";
      case "alerta": return "bg-warning";
      case "error": return "bg-danger";
      case "general": return "bg-info";
      default: return "bg-secondary";
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationRef,
        showNotifications,
        toggleNotifications,
        openNotifications,
        closeNotifications,
        notifications: deferredNotifications,
        unreadCount,
        loading,
        fetchNotifications,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getNotificationBadgeColor,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

const READ_KEY = "readNotifications";
const HIDDEN_KEY = "hiddenNotifications";

const getReadMap = () => {
  try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; }
  catch { return {}; }
};
const setReadMap = (map) => localStorage.setItem(READ_KEY, JSON.stringify(map));
const addReadLocal = (id) => {
  const m = getReadMap();
  if (!m[id]) { m[id] = true; setReadMap(m); }
};

const getHiddenNotifications = () => {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || []; }
  catch { return []; }
};
const addHiddenLocal = (id) => {
  const arr = getHiddenNotifications();
  if (!arr.includes(id)) {
    arr.push(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
  }
};

const cleanupReadOverlayFromServer = (serverData) => {
  const map = getReadMap();
  let touched = false;
  for (const n of serverData) {
    if (n.leida === true && map[n.notificacion_id]) {
      delete map[n.notificacion_id];
      touched = true;
    }
  }
  if (touched) setReadMap(map);
};
