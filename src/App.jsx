import React from "react";
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes"
import { loadModels } from "./services/faceApiService";

const App = () => {
  useEffect(() => {
    const boot = async () => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready.catch(() => { });
        }
        await loadModels();
        console.log("Modelos de reconocimiento facial precargados");
      } catch (err) {
        console.error("Error al cargar modelos:", err);
      }
    };
    boot();
  }, []);

  return (
    <div>
      <AppRoutes />
    </div>
  );
};

export default App;
