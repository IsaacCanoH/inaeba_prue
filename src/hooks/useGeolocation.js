import { useState } from "react";

export const useGeolocation = () => {
  const [error, setError] = useState(null);

  const getCoordinates = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error("Geolocalización no soportada por este navegador.");
        setError(err.message);
        return reject(err);
      }

      const tryGetLocation = (options) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            resolve({ latitude, longitude });
          },
          (err) => {
            if (options.enableHighAccuracy && err.code === err.TIMEOUT) {
              // Fallback si falla por timeout con alta precisión
              tryGetLocation({
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 0,
              });
            } else {
              let message;
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  message = "Permiso de ubicación denegado.";
                  break;
                case err.POSITION_UNAVAILABLE:
                  message = "La información de ubicación no está disponible.";
                  break;
                case err.TIMEOUT:
                  message = "La solicitud de ubicación expiró.";
                  break;
                default:
                  message = "Error desconocido al obtener ubicación.";
              }
              setError(message);
              reject(new Error(message));
            }
          },
          options
        );
      };

      // Primer intento: alta precisión
      tryGetLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

  return {
    getCoordinates,
    error,
  };
};
