

export const showNotificacion = (title, message) => {
    if (!("Notification" in window)) return;
  
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "⚠️", 
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            body: message,
            icon: "⚠️",
          });
        }
      });
    }
  };
  