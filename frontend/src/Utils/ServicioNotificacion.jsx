const LOCAL_KEY_PREFIX = "gecko_house_notifications_";

/**
 * Guarda una nueva notificación local para el usuario específico
 * @param {{ tipo: string, descripcion: string, timestamp: string, color: string, icono: string }} notification
 * @param {string} username - Nombre de usuario
 */
export const saveLocalNotification = (notification, username) => {
  // Si no hay username (usuario no autenticado), usar una clave genérica
  const storageKey = username ? `${LOCAL_KEY_PREFIX}${username}` : `${LOCAL_KEY_PREFIX}guest`;
  
  const existing = getLocalNotifications(username);
  const updated = [notification, ...existing];
  localStorage.setItem(storageKey, JSON.stringify(updated));
};

/**
 * Retorna todas las notificaciones locales para el usuario específico
 * @param {string} username - Nombre de usuario
 * @returns {Array<{ tipo: string, descripcion: string, timestamp: string, color: string, icono: string }>}
 */
export const getLocalNotifications = (username) => {
  // Si no hay username (usuario no autenticado), usar una clave genérica
  const storageKey = username ? `${LOCAL_KEY_PREFIX}${username}` : `${LOCAL_KEY_PREFIX}guest`;
  
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
};

/**
 * Marca todas las notificaciones como leídas (las borra) para el usuario específico
 * @param {string} username - Nombre de usuario
 */
export const clearLocalNotifications = (username) => {
  const storageKey = username ? `${LOCAL_KEY_PREFIX}${username}` : `${LOCAL_KEY_PREFIX}guest`;
  localStorage.removeItem(storageKey);
};