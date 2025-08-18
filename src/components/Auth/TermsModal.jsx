import { FileText, Check, X } from "lucide-react"

const TermsModal = ({ show, onAccept, onReject, styles }) => {
  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onReject}></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} onClick={onReject}>
        <div
          className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg">
            {/* Header */}
            <div className="modal-header bg-primary text-white border-0">
              <h5 className="modal-title fw-bold d-flex align-items-center">
                <FileText size={20} className="me-2" />
                Términos y Condiciones
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onReject}
                aria-label="Cerrar"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              <div className="terms-content">
                <h6 className="text-primary fw-semibold mb-3">TÉRMINOS Y CONDICIONES DE USO - SISTEMA INAEBA</h6>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">1. Aceptación de los Términos</h6>
                  <p className="text-muted small mb-3">
                    Al registrarse en el sistema INAEBA, usted acepta cumplir con estos términos y condiciones. Si no
                    está de acuerdo con alguno de estos términos, no debe utilizar este sistema.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">2. Uso del Sistema</h6>
                  <p className="text-muted small mb-2">
                    El sistema está destinado exclusivamente para empleados de INAEBA. Usted se compromete a:
                  </p>
                  <ul className="text-muted small mb-3">
                    <li>Proporcionar información veraz y actualizada</li>
                    <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                    <li>Utilizar el sistema únicamente para fines laborales autorizados</li>
                    <li>No compartir su cuenta con terceros</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">3. Protección de Datos</h6>
                  <p className="text-muted small mb-3">
                    INAEBA se compromete a proteger su información personal de acuerdo con la Ley Federal de Protección
                    de Datos Personales. Sus datos serán utilizados únicamente para fines administrativos y laborales de
                    la institución.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">4. Responsabilidades del Usuario</h6>
                  <p className="text-muted small mb-2">Como usuario del sistema, usted es responsable de:</p>
                  <ul className="text-muted small mb-3">
                    <li>Mantener actualizados sus datos de contacto</li>
                    <li>Reportar cualquier uso no autorizado de su cuenta</li>
                    <li>Cumplir con las políticas internas de INAEBA</li>
                    <li>Utilizar el sistema de manera ética y profesional</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">5. Limitaciones y Restricciones</h6>
                  <p className="text-muted small mb-3">
                    INAEBA se reserva el derecho de suspender o cancelar cuentas que no cumplan con estos términos o que
                    representen un riesgo para la seguridad del sistema.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-2">6. Tratamiento de Datos Sensibles</h6>
                  <p className="text-muted small mb-3">
                    Como parte del proceso de validación y control de asistencia, el sistema podrá requerir el acceso a
                    su ubicación geográfica en tiempo real y la captura de su imagen facial para fines de
                    reconocimiento. Estos datos se utilizarán exclusivamente con fines institucionales y serán
                    resguardados conforme a la normativa vigente.
                  </p>
                  <p className="text-muted small mb-3">
                    El uso del sistema implica su consentimiento expreso para el tratamiento de estos datos sensibles.
                    Queda estrictamente prohibido compartir credenciales, tokens, códigos QR u otros medios de acceso con
                    compañeros u otras personas no autorizadas. Esta práctica puede derivar en sanciones administrativas
                    o la suspensión del acceso al sistema.
                  </p>
                </div>

                <div className="alert alert-info border-0 bg-light">
                  <p className="mb-0 small">
                    <strong>Importante:</strong> Al hacer clic en "Acepto", confirma que ha leído, entendido y acepta
                    cumplir con todos los términos y condiciones establecidos.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 bg-light">
              <button type="button" className="btn btn-outline-secondary d-flex align-items-center" onClick={onReject}>
                <X size={16} className="me-2" />
                No Acepto
              </button>
              <button
                type="button"
                className={`${styles["btn-primary"]} btn btn-primary d-flex align-items-center`}
                onClick={onAccept}
              >
                <Check size={16} className="me-2" />
                Acepto y Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TermsModal
