import { useState, useEffect, useMemo } from "react";
import {
  createIncident,
  createIncidentOffline,
  getTypeIncident,
  getEligibleIncidentDates,
  getEligibleIncidentDatesOffline,
  removeEligibleDateOffline
} from "../services/dashboard/incidentsService";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import { useLoader } from "../context/LoaderContext";
import { fileToBase64 } from "../utils/fileUtils";

export const useIncident = (usuario, fetchIncidencias, isOffline) => {
  const { showSuccess, showError, showInfo } = useToast();
  const { createNotification } = useNotifications();
  const { showLoader, hideLoader } = useLoader();

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);

  const [eligibleDates, setEligibleDates] = useState([]);

  const [incidentForm, setIncidentForm] = useState({
    tipo: "",
    descripcion: "",
    fecha_incidencia: "",
    evidencias: [],
  });

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const tipos = await getTypeIncident(isOffline);
        setIncidentTypes(tipos || []);
      } catch (err) {
        console.warn("Error cargando tipos de incidencia:", err?.message);
        setIncidentTypes([]);
      }
    };
    loadTypes();
  }, [isOffline]);

  useEffect(() => {
    const empleadoId = usuario?.user?.empleado_id;
    if (!empleadoId) {
      setEligibleDates([]);
      return;
    }

    const loadEligibleDates = async () => {
      if (isOffline) {
        const offline = await getEligibleIncidentDatesOffline(empleadoId);
        const sanitized = Array.isArray(offline)
          ? offline
            .filter((d) => d?.fecha && typeof d.fecha === "string")
            .map((d) => ({
              fecha: d.fecha,
              estado_final: d.estado_final || d.estado || null,
            }))
          : [];
        setEligibleDates(sanitized);
        return;
      }
      try {
        const data = await getEligibleIncidentDates(empleadoId);
        const sanitized = Array.isArray(data)
          ? data
            .filter((d) => d?.fecha && typeof d.fecha === "string")
            .map((d) => ({
              fecha: d.fecha,
              estado_final: d.estado_final || d.estado || null,
            }))
          : [];
        setEligibleDates(sanitized);
      } catch (err) {
        console.error("Error al cargar fechas elegibles:", err?.message);
        setEligibleDates([]);
      }
    };

    loadEligibleDates();
  }, [usuario?.user?.empleado_id, isOffline, showError]);

  const eligibleDateKeys = useMemo(
    () => new Set(eligibleDates.map((d) => d.fecha)),
    [eligibleDates]
  );

  const handleIncidentChange = ({ target: { name, value } }) => {
    setIncidentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = ({ target: { files } }) => {
    setIncidentForm((prev) => ({
      ...prev,
      evidencias: [...prev.evidencias, ...files],
    }));
  };

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    showLoader("Registrando incidencia...");

    try {
      const empleadoId = usuario?.user?.empleado_id;
      if (!empleadoId) {
        showError("Error: El usuario no tiene un empleado_id definido.");
        return;
      }

      if (!isOffline && eligibleDateKeys.size > 0) {
        if (!incidentForm.fecha_incidencia) {
          showError("Selecciona una fecha de incidencia.");
          return;
        }
        if (!eligibleDateKeys.has(incidentForm.fecha_incidencia)) {
          showError("La fecha seleccionada no es elegible para justificar.");
          return;
        }
      }

      const offlinePayload = await prepareIncidentData(usuario, incidentForm);
      const onlineFormData = prepareFormData(usuario, incidentForm);

      if (isOffline) {
        await saveOfflineAndNotify(
          offlinePayload,
          empleadoId,
          incidentForm,
          createNotification,
          showInfo
        );

        await removeEligibleDateOffline(empleadoId, incidentForm.fecha_incidencia);

        setEligibleDates((prev) =>
          prev.filter((f) => f.fecha !== incidentForm.fecha_incidencia)
        );
      } else {
        try {
          await createIncident(onlineFormData);

          await createNotification({
            usuario_id: empleadoId,
            titulo: "Incidencia registrada",
            mensaje: "Incidencia enviada correctamente.",
            tipo: "exito",
            leida: false,
            vista: false,
            metadata: {
              descripcion: incidentForm.descripcion,
              fecha: incidentForm.fecha_incidencia,
            },
          });

          showSuccess("Incidencia registrada correctamente.");

          if (typeof fetchIncidencias === "function") {
            await fetchIncidencias(empleadoId);
          }
        } catch (err) {
          console.warn("Falló el envío online, guardando offline:", err?.message);
          await saveOfflineAndNotify(
            offlinePayload,
            empleadoId,
            incidentForm,
            createNotification,
            showInfo
          );
        }
      }

      clearForm();
    } catch (err) {
      console.error(err);
      showError("Error al registrar la incidencia.");
    } finally {
      hideLoader();
    }
  };

  const clearForm = () => {
    setShowIncidentModal(false);
    setIncidentForm({
      tipo: "",
      descripcion: "",
      fecha_incidencia: "",
      evidencias: [],
    });
  };

  return {
    showIncidentModal,
    setShowIncidentModal,
    incidentForm,
    handleIncidentChange,
    handleFileUpload,
    handleSubmitIncident,
    incidentTypes,
    eligibleDates,
  };
};

// Helpers

const prepareIncidentData = async (usuario, form) => {
  const evidencias = await Promise.all(
    form.evidencias.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      content: await fileToBase64(file),
    }))
  );

  return {
    usuario_id: usuario?.user?.empleado_id,
    tipo_incidencia: form.tipo,
    descripcion: form.descripcion,
    fecha_incidencia: form.fecha_incidencia,
    evidencias,
  };
};

const prepareFormData = (usuario, form) => {
  const formData = new FormData();
  formData.append("usuario_id", usuario?.user?.empleado_id);
  formData.append("tipo_incidencia", form.tipo);
  formData.append("descripcion", form.descripcion);
  formData.append("fecha_incidencia", form.fecha_incidencia);
  form.evidencias.forEach((file) => formData.append("archivos", file));
  return formData;
};

const saveOfflineAndNotify = async (
  offlinePayload,
  empleadoId,
  form,
  createNotification,
  showInfo
) => {
  await createIncidentOffline(offlinePayload);
  await createNotification({
    usuario_id: empleadoId,
    titulo: "Incidencia creada",
    mensaje: "Incidencia almacenada. Se enviará cuando haya conexión.",
    tipo: "alerta",
    leida: false,
    vista: false,
    fecha_creacion: new Date().toISOString(),
    metadata: {
      descripcion: form.descripcion,
      fecha: form.fecha_incidencia,
    },
  });
  showInfo("Incidencia almacenada. Se sincronizará cuando haya conexión.");
};
