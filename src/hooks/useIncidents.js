import { useState, useEffect } from "react"
import { getIncidentsByUser, saveIncidentsOffline, getIncidentsOffline } from "../services/dashboard/incidentsService"

export const useIncidents = (usuario, isOffline) => {
  const [incidencias, setIncidencias] = useState([])
  const [selectedIncidencia, setSelectedIncidencia] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const empleadoId = usuario?.user?.empleado_id
    if (empleadoId) {
      fetchIncidencias(empleadoId)
    }
  }, [usuario?.user?.empleado_id, isOffline])

  useEffect(() => {
    const handler = () => {
      const empleadoId = usuario?.user?.empleado_id;
      if (empleadoId) fetchIncidencias(empleadoId);
    };
    window.addEventListener("app:sync-finished", handler);
    return () => window.removeEventListener("app:sync-finished", handler);
  }, [usuario?.user?.empleado_id, isOffline]);

  const fetchIncidencias = async (empleadoId) => {
    try {
      setLoading(true);

      const data = isOffline
        ? await getIncidentsOffline(empleadoId)
        : await getIncidentsByUser(empleadoId);

      const mapped = data.map((item) => {
        const evidencias = Array.isArray(item.evidencias)
          ? item.evidencias.filter(ev => ev && ev.ruta_archivo)
          : (item.ruta_archivo
            ? [{ tipo_archivo: item.tipo_archivo, ruta_archivo: item.ruta_archivo }]
            : []);
        const fecha = typeof item.fecha_incidencia === "string" && item.fecha_incidencia.includes("T")
          ? item.fecha_incidencia.split("T")[0]
          : item.fecha_incidencia;

        const estadoFmt = item.estado === "pendiente"
          ? "En Proceso"
          : item.estado?.charAt(0).toUpperCase() + item.estado?.slice(1);

        const motivoRaw = item.motivo ?? item.motivo_rechazo ?? null;
        const motivo = (estadoFmt === "Rechazado") ? motivoRaw : null;

        return {
          usuario_id: usuario?.user?.empleado_id,
          id: item.incidencia_id,
          tipo: item.tipo_incidencia,
          descripcion: item.descripcion,
          fecha_incidencia: fecha,
          estado: estadoFmt,
          motivo,
          evidencias,
        };
      });

      if (!isOffline) {
        await saveIncidentsOffline(mapped);
      }

      setIncidencias(mapped);
    } catch (error) {
      console.error("Error al cargar incidencias:", error);
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  };


  const handleViewIncidencia = (incidencia) => {
    setSelectedIncidencia(incidencia)
    setShowModal(true)
  }

  const handleDownloadFile = (archivo_url, archivo_nombre) => {
    const link = document.createElement("a")
    link.href = archivo_url
    link.download = archivo_nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    incidencias,
    selectedIncidencia,
    showModal,
    loading,
    setShowModal,
    handleViewIncidencia,
    handleDownloadFile,
    fetchIncidencias
  }
}
