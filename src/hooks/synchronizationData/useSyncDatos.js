import { useEffect, useRef, useCallback } from "react";
import { syncPendingData } from "../../services/synchronizationData/syncDispatcher";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationContext";
import { useSyncStatus } from "../../context/SyncContext";
import { useLoader } from "../../context/LoaderContext";

export const useSyncData = (usuario, isOffline) => {
  const { showSuccess, showError } = useToast();
  const { createNotification } = useNotifications();
  const { bumpSync } = useSyncStatus();
  const { showLoader, hideLoader } = useLoader();

  const handlerRef = useRef(null);
  const alreadySynced = useRef(false);
  const isSyncing = useRef(false);

  const loaderTimerRef = useRef(null);
  const loaderShownRef = useRef(false);

  const currentUserId = usuario?.user?.empleado_id;

  const sync = useCallback(async () => {
    if (!currentUserId || isSyncing.current || isOffline) return;

    isSyncing.current = true;
    loaderShownRef.current = false;

    loaderTimerRef.current = setTimeout(() => {
      showLoader("Sincronizando datos pendientes...");
      loaderShownRef.current = true;
    }, 400);

    let count = 0;
    try {
      count = await syncPendingData(currentUserId, createNotification);

      if (count > 0) {
        showSuccess(`Se sincronizaron ${count} dato(s) pendiente(s).`);
      }
    } catch (err) {
      console.error("Error al sincronizar datos:", err?.message || err);
      showError("Error al sincronizar datos pendientes.");
    } finally {
      if (loaderTimerRef.current) {
        clearTimeout(loaderTimerRef.current);
        loaderTimerRef.current = null;
      }
      if (loaderShownRef.current) {
        hideLoader();
        loaderShownRef.current = false;
      }

      isSyncing.current = false;
      bumpSync();

      try {
        window.dispatchEvent(
          new CustomEvent("app:sync-finished", {
            detail: { userId: currentUserId, count },
          })
        );
      } catch {
        /* no-op */
      }
    }
  }, [currentUserId, isOffline, createNotification, showSuccess, showError, bumpSync, showLoader, hideLoader]);

  useEffect(() => {
    handlerRef.current = sync;
  }, [sync]);

  useEffect(() => {
    if (!isOffline && !alreadySynced.current) {
      alreadySynced.current = true;
      handlerRef.current?.();
    }
    if (isOffline) {
      alreadySynced.current = false;
    }
  }, [isOffline]);
};
