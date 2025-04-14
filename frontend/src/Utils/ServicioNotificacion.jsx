const LOCAL_KEY = "visual_notifications";

/**
 * Guarda una nueva notificación local
 * @param {{ tipo: string, descripcion: string, timestamp: string }} notification
 */
export const saveLocalNotification = (notification) => {
  const existing = getLocalNotifications();
  const updated = [notification, ...existing];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
};

/**
 * Retorna todas las notificaciones locales
 * @returns {Array<{ tipo: string, descripcion: string, timestamp: string }>}
 */
export const getLocalNotifications = () => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

/**
 * Marca todas las notificaciones como leídas (las borra en este caso)
 */
export const clearLocalNotifications = () => {
  localStorage.removeItem(LOCAL_KEY);
};