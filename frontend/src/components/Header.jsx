import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import notificationIcon from "../assets/campana.png";
import userIcon from "../assets/usuario.png";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import { 
  NavBar, 
  LogoImg, 
  NavContent, 
  Menu, 
  MenuItem, 
  RightSection, 
  IconButton, 
  LoginButton,
  NotificationDropdown, 
  NotificationItem, 
  NotificationTitle,
  NotificationDescription, 
  NoNotifications, 
  DropdownMenu, 
  DropdownMenuItem, 
  NotificationHeader, 
  NotificationBadge, 
  UnreadIndicator,
  UserName,
  NotificationIconContainer,
} from "./NavBarStyles";

const Header = ({ setHeaderHeight = () => {} }) => {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const token = localStorage.getItem("token");

  let username = '';
  let userId = '';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.user;
      userId = decoded.id;
    } catch (error) {
      console.error("Error al decodificar token:", error);
      localStorage.removeItem("token"); // Eliminar token inválido
    }
  }

  // Configuración para el polling de notificaciones
  const POLLING_INTERVAL = 30000; // 30 segundos para recargar notificaciones

  // Efecto para actualizar la altura del header
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [token, setHeaderHeight]);

  // Efecto para cargar notificaciones iniciales y configurar la actualización periódica
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchNotifications();
      
      // Configurar intervalo para actualizar notificaciones periódicamente
      const notificationInterval = setInterval(() => {
        fetchNotifications();
      }, POLLING_INTERVAL);
      
      return () => clearInterval(notificationInterval);
    }
  }, [isAuthenticated, userId, location.pathname]); // Agregado location.pathname para recargar en cambios de ruta

  // Efecto para actualizar el tiempo actual
  useEffect(() => {
    const timerInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Función para obtener notificaciones desde el servidor
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/getNotificationsByUserId/${userId}`);
      const data = response.data;
      if (data.notifications) {
        const formattedNotifications = data.notifications.map(notif => ({
          id: notif.id_notificacion,
          tipo: notif.tipo,
          descripcion: notif.descripcion,
          time_alert: notif.time_alert,
          is_read: notif.is_read === 1 || notif.is_read === true,
        }));
        
        // Guardar notificaciones en el estado local
        setNotifications(formattedNotifications);
        
        // Calcular el número de notificaciones no leídas
        const unreadNotifications = formattedNotifications.filter(notif => !notif.is_read);
        setUnreadCount(unreadNotifications.length);
        
        // También guardar en localStorage para persistencia entre rutas
        localStorage.setItem('notifications', JSON.stringify(formattedNotifications));
        localStorage.setItem('unreadCount', unreadNotifications.length.toString());
      }
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      
      // En caso de error, intentar cargar desde localStorage
      const cachedNotifications = localStorage.getItem('notifications');
      if (cachedNotifications) {
        setNotifications(JSON.parse(cachedNotifications));
        setUnreadCount(parseInt(localStorage.getItem('unreadCount') || '0'));
      }
    }
  };

  // Al iniciar sesión, cargar desde localStorage mientras se obtienen los datos del servidor
  useEffect(() => {
    if (isAuthenticated) {
      const cachedNotifications = localStorage.getItem('notifications');
      if (cachedNotifications) {
        setNotifications(JSON.parse(cachedNotifications));
        setUnreadCount(parseInt(localStorage.getItem('unreadCount') || '0'));
      }
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("notifications");
    localStorage.removeItem("unreadCount");
    setIsAuthenticated(false);
    setNotifications([]);
    setUnreadCount(0);
    navigate("/login");
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      // Actualizar en la base de datos
      await axios.post(`http://localhost:5000/api/markNotificationAsRead/${notificationId}/${userId}`);
      
      // Actualizar el estado local
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      );
      
      setNotifications(updatedNotifications);
      
      // Recalcular el contador de no leídas
      const unreadNotifications = updatedNotifications.filter(notif => !notif.is_read);
      setUnreadCount(unreadNotifications.length);
      
      // Actualizar el localStorage
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      localStorage.setItem('unreadCount', unreadNotifications.length.toString());
      
      setNotificationMenuVisible(false);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Actualizar en la base de datos
      await axios.post(`http://localhost:5000/api/markAllNotificationsAsRead/${userId}`);
      
      // Actualizar estado local
      const updatedNotifications = notifications.map(notif => ({ ...notif, is_read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Actualizar localStorage
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      localStorage.setItem('unreadCount', '0');
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
    }
  };

  const handleNotificationIconClick = () => {
    setNotificationMenuVisible(prev => !prev);
    setMenuVisible(false);
  };

  const handleClickOutside = (event) => {
    if (notificationMenuVisible || menuVisible) {
      if (!event.target.closest('.dropdown-menu') && 
          !event.target.matches('[alt="Notificaciones"]') && 
          !event.target.matches('[alt="Usuario"]')) {
        setNotificationMenuVisible(false);
        setMenuVisible(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [notificationMenuVisible, menuVisible]);

  const getTimeElapsedDynamic = (timeStamp) => {
    if (!timeStamp) return "FECHA DESCONOCIDA";
    
    try {
      const referenceTime = new Date();
      let alertDate;

      if (typeof timeStamp === 'string') {
        const [datePart, timePart] = timeStamp.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        alertDate = new Date(year, month - 1, day, hours, minutes, seconds);
      } else if (timeStamp instanceof Date) {
        alertDate = timeStamp;
      } else {
        alertDate = new Date(Number(timeStamp));
      }

      if (isNaN(alertDate.getTime())) {
        console.error("No se pudo convertir a fecha válida:", timeStamp);
        return "FECHA INVÁLIDA";
      }

      const diffMs = Math.max(0, referenceTime - alertDate);
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffSecs < 60) {
        return diffSecs <= 1 ? "HACE UN SEGUNDO" : `HACE ${diffSecs} SEGUNDOS`;
      } else if (diffMins < 60) {
        return diffMins === 1 ? "HACE UN MINUTO" : `HACE ${diffMins} MINUTOS`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? "HACE UNA HORA" : `HACE ${diffHours} HORAS`;
      } else if (diffDays < 7) {
        return diffDays === 1 ? "HACE UN DÍA" : `HACE ${diffDays} DÍAS`;
      } else if (diffWeeks < 4) {
        return diffWeeks === 1 ? "HACE UNA SEMANA" : `HACE ${diffWeeks} SEMANAS`;
      } else if (diffMonths < 12) {
        return diffMonths === 1 ? "HACE UN MES" : `HACE ${diffMonths} MESES`;
      } else {
        const diffYears = Math.floor(diffMonths / 12);
        return diffYears === 1 ? "HACE UN AÑO" : `HACE ${diffYears} AÑOS`;
      }
    } catch (error) {
      console.error("Error al calcular tiempo transcurrido:", error);
      return "FECHA DESCONOCIDA";
    }
  };

  return (
    <NavBar ref={headerRef}>
      <LogoImg src={logo} alt="Logo" onClick={() => navigate("/")} />
      <NavContent>
        <Menu>
          <MenuItem onClick={() => navigate("/")}>Inicio</MenuItem>
          <MenuItem onClick={() => navigate("/dashboard")}>Centro de monitoreo y control</MenuItem>
          <MenuItem onClick={() => navigate("/historial")}>Historial de datos</MenuItem>
        </Menu>
      </NavContent>
      
      <RightSection>
        {isAuthenticated ? (
          <>
            <NotificationIconContainer>
              <UserName>{username}</UserName>
              <IconButton src={notificationIcon} alt="Notificaciones" onClick={handleNotificationIconClick} />
              {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
              {notificationMenuVisible && (
                <NotificationDropdown className="dropdown-menu">
                  <NotificationHeader>
                    Notificaciones
                    {unreadCount > 0 && (
                      <span onClick={markAllAsRead} style={{ fontSize: '0.8rem', color: '#5a5a5a', cursor: 'pointer' }}>
                        Marcar todas como leídas
                      </span>
                    )}
                  </NotificationHeader>
                  {notifications.length > 0 ? notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      onClick={() => handleNotificationClick(notification.id)}
                      style={{ 
                        backgroundColor: notification.is_read ? 'transparent' : 'rgba(235, 245, 255, 0.5)' 
                      }}
                    >
                      <NotificationTitle>
                        <UnreadIndicator read={notification.is_read} />
                        {notification.tipo}
                      </NotificationTitle>
                      <NotificationDescription>{notification.descripcion}</NotificationDescription>
                      <small style={{ color: '#777', fontSize: '0.75rem' }}>
                        {getTimeElapsedDynamic(notification.time_alert)}
                      </small>
                    </NotificationItem>
                  )) : (
                    <NoNotifications>No tienes notificaciones</NoNotifications>
                  )}
                </NotificationDropdown>
              )}
            </NotificationIconContainer>

            <IconButton src={userIcon} alt="Usuario" onClick={() => setMenuVisible(prev => !prev)} />
            {menuVisible && (
              <DropdownMenu className="dropdown-menu">
                <DropdownMenuItem onClick={() => navigate("/editar-datos")}>Editar datos</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
              </DropdownMenu>
            )}
          </>
        ) : (
          <LoginButton onClick={() => navigate("/login")}>Iniciar sesión</LoginButton>
        )}
      </RightSection>
    </NavBar>
  );
};

export default Header;