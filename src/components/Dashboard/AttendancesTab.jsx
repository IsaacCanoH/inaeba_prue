import { Clock, BarChart3, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const AttendancesTab = ({ attendanceHistory, statistics, loading }) => {
  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "puntual":
        return <CheckCircle size={18} />
      case "retardo":
        return <Clock size={18} />
      case "falta":
        return <XCircle size={18} />
      case "incompleta":
        return <AlertTriangle size={18} />
      default:
        return null
    }
  }

  const getEstadoBadge = (estado) => {
    const baseClasses = "badge rounded-pill px-3 py-2 fw-normal d-inline-flex align-items-center"
    switch (estado) {
      case "puntual":
        return `${baseClasses} bg-success bg-opacity-10 text-success`
      case "retardo":
        return `${baseClasses} bg-warning bg-opacity-10 text-warning`
      case "falta":
        return `${baseClasses} bg-danger bg-opacity-10 text-danger`
      case "incompleta":
        return `${baseClasses} bg-secondary bg-opacity-10 text-secondary`
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
        <p className="mt-3 text-muted">Cargando asistencias...</p>
      </div>
    );
  }

  return (
    <>
      {/* Estadísticas */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-success bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <CheckCircle size={32} className="text-success mb-3" />
              <h4 className="fw-bold text-success mb-1">{statistics.asistencias ?? 0}</h4>
              <small className="text-success opacity-75 fw-medium">Asistencias</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-warning bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <Clock size={32} className="text-warning mb-3" />
              <h4 className="fw-bold text-warning mb-1">{statistics.retardos ?? 0}</h4>
              <small className="text-warning opacity-75 fw-medium">Retardos</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-danger bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <XCircle size={32} className="text-danger mb-3" />
              <h4 className="fw-bold text-danger mb-1">{statistics.faltas ?? 0}</h4>
              <small className="text-danger opacity-75 fw-medium">Faltas</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 bg-secondary bg-opacity-10 h-100">
            <div className="card-body text-center py-4">
              <AlertTriangle size={32} className="text-secondary mb-3" />
              <h4 className="fw-bold text-secondary mb-1">{statistics.incompletas ?? 0}</h4>
              <small className="text-secondary opacity-75 fw-medium">Incompletas</small>
            </div>
          </div>
        </div>
      </div>

      {/* Nueva fila para Efectividad */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3 mx-auto">
          <div className="card border-0 h-100 bg-primary bg-opacity-10">
            <div className="card-body text-center py-4">
              <BarChart3 size={32} className="mb-3 text-primary" />
              <h4 className="fw-bold mb-1 text-primary">{statistics.porcentaje ?? 0}%</h4>
              <small className="opacity-75 fw-medium text-primary">Efectividad</small>
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-4 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-dark fw-semibold d-flex align-items-center">
            <Clock size={20} className="me-2 text-primary" />
            Registros Recientes
          </h6>
          <span className="badge bg-light text-muted">Últimos 30 días</span>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush" style={{ maxHeight: "200px", overflowY: "auto" }}>
            {attendanceHistory.length === 0 ? (
              <div className="text-center py-5 text-muted fw-medium">
                <p className="mb-0">No tienes asistencias registradas del mes aún.</p>
              </div>
            ) : (
              attendanceHistory.map((registro, index) => (
                <div key={index} className="list-group-item border-bottom border-0 py-4 px-4">
                  <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center">
                    {/* Vista móvil */}
                    <div className="d-md-none w-100">
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                        <div className="fw-semibold text-dark flex-shrink-0">{registro.fecha}</div>
                        <span className={`${getEstadoBadge(registro.estado_final)} flex-shrink-0`}>
                          {getEstadoIcon(registro.estado)}
                          <span className="ms-2 text-capitalize fw-medium">{registro.estado_final}</span>
                        </span>
                      </div>
                      <div className="row g-2 text-center">
                        <div className="col-4">
                          <small className="text-muted fw-medium d-block">Entrada</small>
                          <small className="fw-semibold text-dark">{registro.entrada}</small>
                        </div>
                        <div className="col-4">
                          <small className="text-muted fw-medium d-block">Salida</small>
                          <small className="fw-semibold text-dark">{registro.salida}</small>
                        </div>
                        <div className="col-4">
                          <small className="text-muted fw-medium d-block">Horas</small>
                          <small className="fw-semibold text-dark">{registro.horas} hrs.</small>
                        </div>
                      </div>
                    </div>

                    {/* Vista desktop */}
                    <div className="d-none d-md-block">
                      <div className="fw-semibold text-dark">{registro.fecha}</div>
                    </div>

                    <div className="d-none d-md-flex gap-4">
                      <div className="text-center">
                        <small className="text-muted fw-medium">Hora Entrada</small>
                        <div className="fw-semibold text-dark">{registro.entrada}</div>
                      </div>
                      <div className="text-center">
                        <small className="text-muted fw-medium">Hora Salida</small>
                        <div className="fw-semibold text-dark">{registro.salida}</div>
                      </div>
                      <div className="text-center">
                        <small className="text-muted fw-medium">Horas Asistidas</small>
                        <div className="fw-semibold text-dark">{registro.horas} hrs.</div>
                      </div>
                    </div>

                    {/* Estado solo en desktop */}
                    <span className={`d-none d-md-inline-flex ${getEstadoBadge(registro.estado_final)}`}>
                      {getEstadoIcon(registro.estado)}
                      <span className="ms-2 text-capitalize fw-medium">{registro.estado_final}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AttendancesTab
