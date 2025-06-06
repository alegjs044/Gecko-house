export const showNotificacion = (title, message) => {
  console.log("🔔 Intentando mostrar notificación:", title, message);
  
  if (!("Notification" in window)) {
    console.log("❌ Notificaciones no soportadas");
    return;
  }

  if (Notification.permission === "granted") {
    console.log("✅ Creando notificación...");
    new Notification(title, {
      body: message,
      icon: "/favicon.ico",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("✅ Permiso concedido, creando notificación...");
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
        });
      }
    });
  } else {
    console.log("❌ Notificaciones denegadas");
  }
};