import Webcam from "react-webcam"
import { useFaceRecognition } from "../../hooks/useFaceRecognition"
import "../../styles/face.modal.css"

const FaceRecognitionModal = ({ show, onSuccess, onFailure, usuario, onClose }) => {
  const { webcamRef, feedback, loadingFace } = useFaceRecognition({ show, usuario, onSuccess, onFailure })

  if (!show) return null

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header text-white bg-primary">
            <h5 className="modal-title">Reconocimiento Facial</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body text-center">
            {loadingFace && (
              <div className="spinner-border mb-3 text-primary" role="status"></div>
            )}

            <div className="feedback-container mb-3">
              <h5>Instrucciones</h5>
              <p>{feedback}</p>
            </div>

            <div className="face-recognition-container mb-3">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="face-webcam"
              />
              <div className="camera-overlay"></div>
            </div>

            <p className="face-instructions">
              Coloca tu rostro al centro del círculo y mantén una distancia adecuada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceRecognitionModal
