import { FileText, Calendar, AlertCircle, Download, Eye } from "lucide-react"

const IncidenciasTab = ({
  usuario,
  isOffline,
  incidencias,
  selectedIncidencia,
  showModal,
  loading,
  setShowModal,
  handleViewIncidencia,
  handleDownloadFile,
}) => {
  const getEstadoBadge = (estado) => {
    const baseClasses = "badge rounded-pill px-3 py-2 fw-normal"
    switch (estado) {
      case "En Proceso":
        return `${baseClasses} bg-warning bg-opacity-10 text-warning`
      case "Aprobado":
        return `${baseClasses} bg-success bg-opacity-10 text-success`
      case "Rechazado":
        return `${baseClasses} bg-danger bg-opacity-10 text-danger`
      default:
        return `${baseClasses} bg-secondary bg-opacity-10 text-secondary`
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando incidencias...</p>
      </div>
    )
  }

  return (
    <>
      {/* Estadísticas de Incidencias */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-warning bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <AlertCircle size={32} className="text-warning mb-3" />
              <h4 className="fw-bold text-warning mb-1">
                {incidencias.filter((i) => i.estado === "En Proceso").length}
              </h4>
              <small className="text-warning opacity-75 fw-medium">En Proceso</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-success bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <FileText size={32} className="text-success mb-3" />
              <h4 className="fw-bold text-success mb-1">{incidencias.filter((i) => i.estado === "Aprobado").length}</h4>
              <small className="text-success opacity-75 fw-medium">Aprobadas</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-danger bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <AlertCircle size={32} className="text-danger mb-3" />
              <h4 className="fw-bold text-danger mb-1">{incidencias.filter((i) => i.estado === "Rechazado").length}</h4>
              <small className="text-danger opacity-75 fw-medium">Rechazadas</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-primary bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <FileText size={32} className="mb-3 text-primary" />
              <h4 className="fw-bold mb-1 text-primary">{incidencias.length}</h4>
              <small className="opacity-75 fw-medium text-primary">Total</small>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Incidencias */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-4 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-dark fw-semibold d-flex align-items-center">
            <FileText size={20} className="me-2 text-primary" />
            Mis Incidencias
          </h6>
          <span className="badge bg-light text-muted">Total: {incidencias.length}</span>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {incidencias.length === 0 ? (
              <div className="text-center py-5 text-muted fw-medium">
                <FileText size={48} className="text-muted opacity-50 mb-3" />
                <p className="mb-0">No tienes incidencias registradas aún.</p>
              </div>
            ) : (
              incidencias.map((incidencia, idx) => {
                const key =
                  incidencia.id ??
                  incidencia.incidencia_id ??
                  incidencia._id ??
                  `${incidencia.usuario_id || "u0"}|${incidencia.fecha_incidencia || "f0"}|${incidencia.tipo || "t0"}|${idx}`

                return (
                  <div key={key} className="list-group-item border-bottom border-0 py-4 px-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <FileText size={18} className="text-primary" />
                          <h6 className="mb-0 ms-2 fw-semibold text-dark">{incidencia.tipo}</h6>
                          <span className={`ms-auto ${getEstadoBadge(incidencia.estado)}`}>{incidencia.estado}</span>
                        </div>
                        <p className="text-muted mb-2 small" style={{ lineHeight: "1.4" }}>
                          {(incidencia.descripcion || "").length > 100
                            ? `${(incidencia.descripcion || "").substring(0, 100)}...`
                            : (incidencia.descripcion || "")}
                        </p>
                        <div className="d-flex align-items-center gap-3 text-muted small">
                          <span className="d-flex align-items-center">
                            <Calendar size={14} className="me-1" />
                            {incidencia.fecha_incidencia}
                          </span>

                          {incidencia.evidencias?.length > 0 && (
                            <span className="d-flex align-items-center">
                              <FileText size={14} className="me-1" />
                              {incidencia.evidencias.length} archivo(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          onClick={() => handleViewIncidencia(incidencia)}
                        >
                          <Eye size={14} className="me-1" />
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedIncidencia && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <FileText size={20} className="text-primary" />
                  <span className="ms-2">Detalles de Incidencia</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body pt-2">
                <div className="row g-4">
                  {/* Información Principal */}
                  <div className="col-12">
                    <div className="card border-0 bg-light">
                      <div className="card-body p-4">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark small mb-1">Tipo de Incidencia</label>
                            <div className="d-flex align-items-center">
                              <FileText size={16} className="text-primary" />
                              <span className="ms-2 fw-medium">{selectedIncidencia.tipo}</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold text-dark small mb-1">Estado</label>
                            <div>
                              <span className={getEstadoBadge(selectedIncidencia.estado)}>
                                {selectedIncidencia.estado}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold text-dark small mb-1">Fecha de Incidencia</label>
                            <div className="d-flex align-items-center">
                              <Calendar size={16} className="text-muted me-2" />
                              <span>{selectedIncidencia.fecha_incidencia}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark small mb-2">Descripción Detallada</label>
                    <div className="card border-0 bg-light">
                      <div className="card-body p-4">
                        <p className="mb-0 text-dark" style={{ lineHeight: "1.6" }}>
                          {selectedIncidencia.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Motivo del Rechazo */}
                  {selectedIncidencia.estado === "Rechazado" && selectedIncidencia.motivo && (
                    <div className="col-12">
                      <label className="form-label fw-semibold text-danger small mb-2 d-flex align-items-center">
                        <AlertCircle size={16} className="me-2" />
                        Motivo del Rechazo
                      </label>
                      <div className="card border-0 bg-danger bg-opacity-10">
                        <div className="card-body p-4">
                          <p className="mb-0 text-danger fw-medium" style={{ lineHeight: "1.6" }}>
                            {selectedIncidencia.motivo}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Archivo de Evidencia */}
                  {selectedIncidencia.evidencias?.length > 0 && (
                    <div className="col-12">
                      <label className="form-label fw-semibold text-dark small mb-2">Archivos de Evidencia</label>
                      <div className="card border-0 bg-light">
                        <div className="card-body p-4">
                          <ul className="list-unstyled mb-0">
                            {selectedIncidencia.evidencias.map((ev, i) => {
                              const evKey = ev.id ?? ev.ruta_archivo ?? `${selectedIncidencia.id || "inc"}-ev-${i}`
                              return (
                                <li key={evKey} className="d-flex align-items-center justify-content-between py-2">
                                  <div className="d-flex align-items-center">
                                    <FileText size={20} className="text-primary me-3" />
                                    <div>
                                      <div className="fw-medium text-dark">{ev.ruta_archivo}</div>
                                      <small className="text-muted">{ev.tipo_archivo}</small>
                                    </div>
                                  </div>
                                  {!isOffline && (
                                    <button
                                      className="btn btn-primary d-flex align-items-center"
                                      onClick={() =>
                                        handleDownloadFile(
                                          `http://localhost:3000/uploads/${ev.ruta_archivo}`,
                                          ev.ruta_archivo,
                                        )
                                      }
                                    >
                                      <Download size={16} className="me-2" />
                                      Descargar
                                    </button>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default IncidenciasTab
