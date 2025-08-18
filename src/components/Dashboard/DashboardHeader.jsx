import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import ProfilePhotoModal from "./ProfilePhotoModal";

const DashboardHeader = ({
  usuario,
  unreadCount,
  showNotifications,
  toggleNotifications,
  closeNotifications,
  notificationRef,
  notifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  getNotificationIcon,
  getNotificationBadgeColor,
  handleLogout,
  isOffline,
  styles
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userPhoto, setUserPhoto] = useState("/images/avt_default.png");

  const formatFechaUTC = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  };

  const handlePhotoUpdate = (newPhotoUrl) => setUserPhoto(newPhotoUrl);

  return (
    <>
      <nav className="navbar navbar-expand-lg shadow-sm border-bottom py-4 bg-primary">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center">
            <div className="me-3 d-flex align-items-center justify-content-center">
              <span className="text-white fw-bold fs-4">INAEBA</span>
            </div>
            <div className="d-none d-md-block">
              <h6 className="mb-0 text-white fw-semibold">Sistema de Administración</h6>
              <small className="text-white opacity-75">Gestión de Asistencias</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Perfil */}
            <div
              className="d-none d-lg-flex align-items-center me-3"
              style={{ cursor: "pointer" }}
              onClick={() => setShowProfileModal(true)}
            >
              <img
                src={userPhoto || "/placeholder.svg"}
                className="rounded-circle me-3"
                width="36"
                height="36"
                style={{ border: "2px solid #ffffff", objectFit: "cover", transition: "transform 0.2s ease" }}
                onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                alt="Foto de perfil"
              />
              <div>
                <div className="fw-semibold text-white">{usuario.user.nombre} {usuario.user.apellido_p} {usuario.user.apellido_m}</div>
                <div className="text-white opacity-75 small">{usuario.user.email}</div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="position-relative" ref={notificationRef}>
              <button
                type="button"
                className="btn btn-light btn-sm rounded-circle p-2 position-relative d-flex align-items-center justify-content-center"
                onClick={toggleNotifications} 
                aria-expanded={showNotifications}
                aria-controls="notifications-panel"
                style={{ width: "40px", height: "40px" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
                    style={{ fontSize: "0.65rem", minWidth: "18px", height: "18px" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  id="notifications-panel"
                  className={`position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border ${styles.notificationsPanel}`}
                  style={{ zIndex: 1050 }}
                >
                  <div className="p-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-semibold d-flex align-items-center text-primary">
                        <Bell size={18} className="me-2 text-primary" />
                        Notificaciones
                      </h6>
                      <div className="d-flex gap-2 align-items-center">
                        {unreadCount > 0 && !isOffline && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            onClick={markAllAsRead}
                            style={{ fontSize: "0.75rem" }}
                          >
                            ✔ Marcar todas
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                          onClick={closeNotifications}
                          style={{ width: "28px", height: "28px" }}
                          aria-label="Cerrar notificaciones"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="d-flex align-items-center justify-content-center mb-3">
                          <Bell size={32} className="text-muted" />
                        </div>
                        <p className="text-muted mb-0">No tienes notificaciones</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.notificacion_id}
                          className="p-4 border-bottom"
                          style={
                            !notification.leida
                              ? {
                                  background:
                                    "linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.08) 0%, rgba(var(--bs-primary-rgb), 0.04) 100%)",
                                  borderLeft: "3px solid var(--bs-primary)",
                                }
                              : {}
                          }
                        >
                          <div className="d-flex align-items-start">
                            <div className="me-3 mt-1 d-flex align-items-center justify-content-center">
                              {getNotificationIcon(notification.tipo)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center">
                                  <h6 className="mb-0 fw-semibold me-2" style={{ fontSize: "0.9rem" }}>
                                    {notification.titulo}
                                  </h6>
                                  {!notification.leida && (
                                    <span
                                      className={`badge rounded-pill ${getNotificationBadgeColor(notification.tipo)} d-flex align-items-center`}
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Nuevo
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex gap-1">
                                  {!notification.leida && !isOffline && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                                      onClick={() => markAsRead(notification.notificacion_id)}
                                      style={{ width: "24px", height: "24px" }}
                                      aria-label="Marcar como leída"
                                    >
                                      ✔
                                    </button>
                                  )}
                                  {!isOffline && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                                      onClick={() => deleteNotification(notification.notificacion_id)}
                                      style={{ width: "24px", height: "24px" }}
                                      aria-label="Eliminar notificación"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="mb-2 text-muted" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                                {notification.mensaje}
                              </p>
                              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {formatFechaUTC(notification.fecha_creacion)}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 text-center border-top">
                      <button type="button" className="btn btn-sm btn-outline-primary mx-auto d-flex align-items-center">
                        <Bell size={14} className="me-2" />
                        Ver todas las notificaciones
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de logout */}
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Modal foto de perfil */}
      <ProfilePhotoModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        usuario={usuario}
        onPhotoUpdate={handlePhotoUpdate}
      />
    </>
  );
};

export default DashboardHeader;
