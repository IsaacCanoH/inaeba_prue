import { useEffect, useRef, useState } from "react";
import { db } from "../../db/indexedDB";
import { decryptData } from "../../utils/cryptoUtils";
import { useSyncStatus } from "../../context/SyncContext";

export const useOfflineExpiration = (usuario, isOffline) => {
  const [isExpired, setIsExpired] = useState(false);
  const { syncTick } = useSyncStatus(); 
  const userId = usuario?.user?.empleado_id;
  const mountedRef = useRef(false);

  const checkExpiration = async () => {
    if (!userId) {
      setIsExpired(false);
      return;
    }

    try {
      const allRecords = await db.encryptedData.orderBy("savedAt").toArray();

      const userRecords = allRecords.filter((record) => {
        try {
          const data = decryptData(record.data);
          return data?.usuario_id === userId;
        } catch {
          return false;
        }
      });

      if (userRecords.length === 0) {
        if (mountedRef.current) setIsExpired(false);
        return;
      }

      const firstDate = new Date(userRecords[0].savedAt);
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffInMs = now - firstDate;

      if (mountedRef.current) setIsExpired(diffInMs >= oneDayMs);
    } catch (err) {
      console.error("Error verificando expiración offline:", err?.message || err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    checkExpiration();
    return () => { mountedRef.current = false; };
  }, [userId]);

  useEffect(() => {
    checkExpiration();
  }, [isOffline, syncTick]);

  useEffect(() => {
    const onChange = () => mountedRef.current && checkExpiration();

    db.encryptedData.hook("creating", onChange);
    db.encryptedData.hook("updating", onChange);
    db.encryptedData.hook("deleting", onChange);

    return () => {
      db.encryptedData.hook("creating").unsubscribe(onChange);
      db.encryptedData.hook("updating").unsubscribe(onChange);
      db.encryptedData.hook("deleting").unsubscribe(onChange);
    };
  }, [userId]);

  return isExpired;
};
