import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import DashboardHeader from "../components/Dashboard/DashboardHeader"
import DashboardTabs from "../components/Dashboard/DashboardTabs"
import QRModal from "../components/Dashboard/QRModal"
import IncidentModal from "../components/Dashboard/IncidentModal"
import FaceRecognitionModal from "../components/Dashboard/FaceRecognitionModal"
import PINModal from "../components/Dashboard/PINModal"
import styles from "../styles/dashboard.module.css"
import "bootstrap/dist/css/bootstrap.min.css"

import { useNotifications } from "../context/NotificationContext"
import { useQrAndFace } from "../hooks/useQrAndFace"
import { useIncident } from "../hooks/useIncident"
import { useAttendances } from "../hooks/useAttendances"
import useAutoLogout from "../hooks/useAutoLogout"
import { useSyncData } from "../hooks/synchronizationData/useSyncDatos"
import { useOfflineExpiration } from "../hooks/synchronizationData/useOfflineExpiration"
import { useIncidents } from "../hooks/useIncidents"
import { useFaltasAuto } from "../hooks/useFaltasAuto"
import { usePinAttendance } from "../hooks/usePinModal"
import { useFaceRecognition } from "../hooks/useFaceRecognition"
import { useNetworkReachability } from "../hooks/useNetworkReachability"

const DashboardPage = () => {
  const navigate = useNavigate()

  useAutoLogout(10 * 60 * 1000)

  //-------------------- Autenticación --------------------
  const storedUser = localStorage.getItem("usuario")
  const usuario = storedUser ? JSON.parse(storedUser) : null
  const { ok } = useNetworkReachability({ url: "/api/health", intervalMs: 5000, timeoutMs: 2500 })
  const isOffline = !ok

  useEffect(() => {
    if (ok && usuario?.offline) {
      const updated = { ...usuario, offline: false }
      localStorage.setItem("usuario", JSON.stringify(updated))
    }
  }, [ok])

  useEffect(() => {
    if (!usuario) {
      navigate("/login", { replace: true })
    }
  }, [usuario, navigate])

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    navigate("/login")
  }

  //-------------------------------------------------------
  useSyncData(usuario, isOffline)
  const isOfflineExpired = useOfflineExpiration(usuario, isOffline)

  //-------------------- Notificaciones --------------------
  const {
    notificationRef,
    showNotifications,
    toggleNotifications,
    closeNotifications,
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationBadgeColor,
  } = useNotifications();

  useEffect(() => {
    if (usuario?.user?.empleado_id) {
      fetchNotifications(usuario.user.empleado_id, isOffline)
    }
  }, [usuario?.user?.empleado_id, fetchNotifications, isOffline])

  //------------------------------------------------------
  const isMobileDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData;

    const isIpadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;

    const mobileRegex = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i;

    const isCoarse = typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)")?.matches;

    return Boolean(uaData?.mobile) || isIpadOS || mobileRegex.test(ua) || isCoarse;
  }, []);

  //-------------------- Asistencias --------------------
  const [activeTab, setActiveTab] = useState("attendances")
  const { attendanceHistory, statistics, fetchAttendances, loading: loadingAttendances } = useAttendances(usuario, isOffline)
  useFaltasAuto(usuario, isOffline, fetchAttendances)

  //----------------------- PIN -------------------------
  const {
    showPINModal,
    setShowPINModal,
    inputsRef,
    handleChange,
    handleKeyDown,
    handleSubmitPIN
  } = usePinAttendance(usuario, attendanceHistory, fetchAttendances)

  //-------------------- QR + Reconocimiento Facial --------------------

  useFaceRecognition(isOffline)

  const {
    showQRModal,
    setShowQRModal,
    cameraActive,
    showFaceModal,
    handleOpenCamera,
    handleCloseCamera,
    handleScanSuccess,
    handleFaceSuccess,
    handleFaceFailure,
  } = useQrAndFace(usuario, attendanceHistory, fetchAttendances)

  const registrarAsistencia = () => {
    if (isMobileDevice) {
      handleOpenCamera();
    } else {
      setShowPINModal(true);
    }
  };

  //-------------------- Incidencias --------------------
  const {
    incidencias,
    selectedIncidencia,
    showModal,
    loading: loadingIncidencias,
    setShowModal,
    handleViewIncidencia,
    handleDownloadFile,
    fetchIncidencias
  } = useIncidents(usuario, isOffline)

  const {
    showIncidentModal,
    setShowIncidentModal,
    incidentForm,
    handleIncidentChange,
    handleFileUpload,
    handleSubmitIncident,
    incidentTypes,
    eligibleDates,
    filteredAttendances
  } = useIncident(usuario, fetchIncidencias, isOffline)


  //-------------------- Render --------------------
  return (
    <div className={`bg-light min-vh-100`}>
      <DashboardHeader
        usuario={usuario}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        toggleNotifications={toggleNotifications}
        closeNotifications={closeNotifications}
        notificationRef={notificationRef}
        notifications={notifications}
        markAllAsRead={markAllAsRead}
        markAsRead={markAsRead}
        deleteNotification={deleteNotification}
        getNotificationIcon={getNotificationIcon}
        getNotificationBadgeColor={getNotificationBadgeColor}
        styles={styles}
        handleLogout={handleLogout}
        isOffline={isOffline}
      />



      <div className="container-fluid px-4 py-4">
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          attendanceHistory={attendanceHistory}
          statistics={statistics}
          setShowIncidenciaModal={setShowIncidentModal}
          loadingAttendances={loadingAttendances}
          usuario={usuario}
          registrarAsistencia={registrarAsistencia}
          setShowQRModal={setShowQRModal}
          isOffline={isOffline}
          isOfflineExpired={isOfflineExpired}
          styles={styles}
          // nuevas props para incidencias
          incidencias={incidencias}
          selectedIncidencia={selectedIncidencia}
          showModal={showModal}
          loadingIncidencias={loadingIncidencias}
          setShowModal={setShowModal}
          handleViewIncidencia={handleViewIncidencia}
          handleDownloadFile={handleDownloadFile}
        />
      </div>

      {showQRModal && (
        <QRModal
          handleOpenCamera={handleOpenCamera}
          handleCloseCamera={handleCloseCamera}
          cameraActive={cameraActive}
          onScanSuccess={handleScanSuccess}
          styles={styles}
        />
      )}

      {showPINModal && (
        <PINModal
          handleClose={() => setShowPINModal(false)}
          handleSubmitPIN={handleSubmitPIN}
          inputsRef={inputsRef}
          handleChange={handleChange}
          handleKeyDown={handleKeyDown}
          styles={styles}
        />
      )}

      {showIncidentModal && (
        <IncidentModal
          incidentForm={incidentForm}
          handleIncidentChange={handleIncidentChange}
          handleFileUpload={handleFileUpload}
          handleSubmitIncident={handleSubmitIncident}
          setShowIncidentModal={setShowIncidentModal}
          eligibleDates={eligibleDates}
          filteredAttendances={filteredAttendances}
          incidentTypes={incidentTypes}
          styles={styles}
        />
      )}

      <FaceRecognitionModal
        show={showFaceModal}
        onSuccess={handleFaceSuccess}
        onFailure={handleFaceFailure}
        usuario={usuario}
        onClose={handleFaceFailure}
      />
    </div>
  )
}

export default DashboardPage