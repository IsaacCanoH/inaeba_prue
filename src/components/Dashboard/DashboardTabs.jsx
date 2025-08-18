import { Clock, Camera, FileText, AlertTriangle } from "lucide-react"
import AttendancesTab from "./AttendancesTab"
import IncidenciasTab from "./IncidentsTabs"

const DashboardTabs = ({
  activeTab,
  setActiveTab,
  attendanceHistory,
  statistics,
  setShowIncidenciaModal,
  loadingAttendances,
  usuario,
  registrarAsistencia,
  isOffline,
  isOfflineExpired,
  incidencias,
  selectedIncidencia,
  showModal,
  loadingIncidencias,
  setShowModal,
  handleViewIncidencia,
  handleDownloadFile,
}) => {
  const renderTabContent = () => {
    if (activeTab === "attendances") {
      return <AttendancesTab attendanceHistory={attendanceHistory} statistics={statistics} loading={loadingAttendances} />
    }

    if (activeTab === "incidencias") {
      return (
        <IncidenciasTab
          usuario={usuario}
          isOffline={isOffline}
          incidencias={incidencias}
          selectedIncidencia={selectedIncidencia}
          showModal={showModal}
          loading={loadingIncidencias}
          setShowModal={setShowModal}
          handleViewIncidencia={handleViewIncidencia}
          handleDownloadFile={handleDownloadFile}
        />
      )
    }

    return null
  }

  const tabs = [
    { key: "attendances", label: "Mis Asistencias", icon: <Clock size={16} className="me-2" /> },
    { key: "incidencias", label: "Mis Incidencias", icon: <FileText size={16} className="me-2" /> },
  ]

  return (
    <>
      <div className="row g-4 mb-4">
        <div className="col-12 d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">
              ¡Bienvenido, {usuario.user.nombre} {usuario.user.apellido_p} {usuario.user.apellido_m}!
            </h4>
            <p className="text-muted mb-0">Gestiona tu asistencia y mantén tu registro actualizado</p>
            {isOffline && (
              <div className="alert alert-warning mt-3 d-flex flex-wrap align-items-center gap-2 py-2 px-3 small">
                <AlertTriangle size={16} className="text-warning flex-shrink-0" />
                <span className="text-break">
                  Estás usando la aplicación en <strong>modo offline</strong>. Algunas funcionalidades podrían estar
                  limitadas.
                </span>
              </div>
            )}
            {isOfflineExpired && (
              <div className="alert alert-danger mt-2 d-flex align-items-center gap-2 py-2 px-3 small">
                <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                <span className="text-break">
                  Has superado el tiempo permitido sin sincronizar. Algunas funciones están bloqueadas hasta conectarte
                  a internet.
                </span>
              </div>
            )}
          </div>
          <div className="d-flex gap-2 flex-column flex-sm-row">
            <button
              className="btn btn-primary px-4 py-2 d-flex align-items-center justify-content-center"
              onClick={registrarAsistencia}
              disabled={isOfflineExpired}
            >
              <Camera size={18} className="me-2" />
              Registrar Asistencia
            </button>
            <button
              className="btn btn-outline-primary px-4 py-2 d-flex align-items-center justify-content-center"
              onClick={() => setShowIncidenciaModal(true)}
              disabled={isOfflineExpired}
            >
              <FileText size={18} className="me-2" />
              Registrar Incidencia
            </button>
          </div>
        </div>
      </div>

      {/* Tabs navegación con scroll horizontal */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 px-0 pt-0">
          {/* Contenedor con scroll horizontal */}
          <div className="px-4 pt-4" style={{ overflowX: "auto", scrollbarWidth: "thin" }}>
            <ul className="nav nav-tabs border-0 d-flex flex-nowrap" style={{ minWidth: "max-content" }}>
              {tabs.map(({ key, label, icon }) => (
                <li className="nav-item flex-shrink-0" key={key}>
                  <button
                    className={`nav-link border-0 px-3 py-2 fw-medium d-flex align-items-center text-nowrap ${
                      activeTab === key ? "active text-primary bg-primary bg-opacity-10" : "text-muted"
                    }`}
                    onClick={() => setActiveTab(key)}
                  >
                    {icon}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="card-body p-4">{renderTabContent()}</div>
      </div>

      <style>{`
        /* Estilos para el scroll horizontal en webkit browsers */
        div[style*="overflowX: auto"]::-webkit-scrollbar {
          height: 4px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }
        
        div[style*="overflowX: auto"]::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Smooth scrolling */
        div[style*="overflowX: auto"] {
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  )
}

export default DashboardTabs
