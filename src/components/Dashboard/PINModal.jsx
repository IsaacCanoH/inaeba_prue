import { Lock } from "lucide-react";

const PINModal = ({
  handleClose,
  handleSubmitPIN,
  inputsRef,
  handleChange,
  handleKeyDown,
}) => {
  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 text-white bg-primary">
            <h5 className="modal-title fw-semibold d-flex align-items-center">
              <Lock size={20} className="me-2" />
              Ingresar PIN de Asistencia
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
            ></button>
          </div>

          <div className="modal-body p-4 text-center">
            <div className="rounded-circle d-inline-flex p-4 mb-4 align-items-center justify-content-center bg-primary bg-opacity-10">
              <Lock size={48} className="text-primary" />
            </div>
            <h6 className="fw-semibold mb-3">Validar con PIN</h6>
            <p className="text-muted mb-3">
              Introduce los 4 dígitos del PIN para registrar tu asistencia.
            </p>

            <div className="d-flex justify-content-center gap-3 mb-4">
              {inputsRef.map((ref, index) => (
                <input
                  key={index}
                  type="password"
                  maxLength={1}
                  className="form-control text-center fs-4 fw-bold"
                  style={{ width: "60px", height: "60px" }}
                  ref={ref}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              ))}
            </div>

            <button
              className="btn btn-primary px-4 py-2 d-flex align-items-center mx-auto"
              onClick={handleSubmitPIN}
            >
              <Lock size={16} className="me-2" />
              Registrar Asistencia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PINModal;
