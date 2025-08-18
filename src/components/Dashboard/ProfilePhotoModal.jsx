import { useState } from "react";
import { Camera, Upload, X } from 'lucide-react';

const ProfilePhotoModal = ({ show, onClose, usuario, onPhotoUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Aquí implementarías la lógica para subir la foto
      // Por ejemplo, usando FormData para enviar al servidor
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('empleado_id', usuario.user.empleado_id);

      // Simulación de upload - reemplaza con tu API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Llamar callback para actualizar la foto en el componente padre
      if (onPhotoUpdate) {
        onPhotoUpdate(previewUrl);
      }
      
      handleClose();
      alert('Fotografía actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar la fotografía:', error);
      alert('Error al actualizar la fotografía');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        style={{ zIndex: 1050 }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            {/* Header */}
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                <Camera size={20} className="me-2 text-primary" />
                Cambiar Fotografía de Perfil
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose}
                disabled={isUploading}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body px-4 py-3">
              {/* Información del usuario */}
              <div className="text-center mb-4">
                <div className="fw-semibold text-dark mb-1">
                  {usuario.user.nombre} {usuario.user.apellido_p} {usuario.user.apellido_m}
                </div>
                <div className="text-muted small">{usuario.user.email}</div>
              </div>

              {/* Preview de la imagen actual/nueva */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <img
                    src={previewUrl || "/images/avt_default.png"}
                    alt="Foto de perfil"
                    className="rounded-circle"
                    width="120"
                    height="120"
                    style={{ 
                      border: "3px solid #0d6efd",
                      objectFit: "cover"
                    }}
                  />
                  {previewUrl && (
                    <div className="position-absolute top-0 end-0">
                      <span className="badge bg-success rounded-pill">
                        Nueva
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Zona de carga */}
              <div className="mb-4">
                <label htmlFor="photoInput" className="form-label fw-medium text-dark">
                  Seleccionar nueva fotografía
                </label>
                <div 
                  className="border border-2 border-dashed rounded-3 p-4 text-center bg-light"
                  style={{ borderColor: '#0d6efd !important' }}
                >
                  <Upload size={32} className="text-primary mb-2" />
                  <p className="mb-2 text-dark fw-medium">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <p className="small text-muted mb-3">
                    Formatos: JPG, PNG, GIF (máximo 5MB)
                  </p>
                  <input
                    type="file"
                    id="photoInput"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Información adicional */}
              <div className="alert alert-info d-flex align-items-start">
                <div className="me-2 mt-1">
                  <div 
                    className="rounded-circle bg-info d-flex align-items-center justify-content-center"
                    style={{ width: '20px', height: '20px' }}
                  >
                    <span className="text-white fw-bold" style={{ fontSize: '12px' }}>i</span>
                  </div>
                </div>
                <div>
                  <small className="text-info fw-medium">
                    Tu nueva fotografía se mostrará en todo el sistema una vez guardada.
                  </small>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 pt-0">
              <button 
                type="button" 
                className="btn btn-light px-4"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary px-4 d-flex align-items-center"
                onClick={handleSavePhoto}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Camera size={16} className="me-2" />
                    Guardar Fotografía
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePhotoModal;
