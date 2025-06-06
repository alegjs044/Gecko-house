import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import notificationIcon from "../assets/campana.png";
import userIcon from "../assets/usuario.png";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { showNotificacion } from "../Utils/showNotificacion";

import {
  saveLocalNotification,
  getLocalNotifications,
  clearLocalNotifications,
} from "../Utils/ServicioNotificacion";

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
} from "../styles/NavBarStyles";

const socket = io("http://localhost:5003");

const Header = ({ setHeaderHeight = () => {} }) => {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentUsername, setCurrentUsername] = useState("");

  const token = localStorage.getItem("token");
  let username = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.user;
    } catch (error) {
      console.error("Error al decodificar token:", error);
      localStorage.removeItem("token");
    }
  }

  // Actualizar el nombre de usuario en el estado cuando cambie el token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUsername(decoded.user);
      } catch (error) {
        console.error("Error al decodificar token:", error);
        setCurrentUsername("");
      }
    } else {
      setCurrentUsername("");
    }
  }, [token]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    setIsAuthenticated(!!token);
  }, [token, setHeaderHeight]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permiso) => {
        if (permiso === "granted") {
          console.log(" Permiso de notificaciones concedido.");
        }
      });
    }
  }, []);
  
  // Cargar notificaciones cuando cambie el nombre de usuario
  useEffect(() => {
    const local = getLocalNotifications(currentUsername);
    setNotifications(local);
  }, [currentUsername]);

  // Escuchar eventos de alertas críticas
  useEffect(() => {
    socket.on("alerta-valor-critico", (data) => {
      // Solo procesar alertas si el usuario está autenticado
      if (!currentUsername) return;
      
      // Obtener información según el tipo de sensor
      const getTipoDescriptivo = () => {
        if (data.tipo_sensor === 'temperatura') {
          return data.zona === 'fria' ? 'Temperatura Zona Fría' : 'Temperatura Zona Caliente';
        } else if (data.tipo_sensor === 'humedad') {
          return 'Humedad';
        } else if (data.tipo_sensor === 'luz_uv') {
          return 'Luz UV';
        }
        return data.tipo_sensor;
      };
      
      const tipo = getTipoDescriptivo();
      
      const getIcono = () => {
        if (data.tipo_sensor === 'temperatura') {
          return data.valor > data.limites.max ? '🔥' : '❄️';
        } else if (data.tipo_sensor === 'humedad') {
          return data.valor > data.limites.max ? '💧' : '🏜️';
        } else if (data.tipo_sensor === 'luz_uv') {
          return data.valor > data.limites.max ? '☀️' : '🌑';
        }
        return '⚠️';
      };
      
      const getColor = () => {
        if (data.tipo_sensor === 'temperatura') {
          return data.valor > data.limites.max ? '#ff5252' : '#4fc3f7';
        } else if (data.tipo_sensor === 'humedad') {
          return data.valor > data.limites.max ? '#64b5f6' : '#ffa726';
        } else if (data.tipo_sensor === 'luz_uv') {
          return data.valor > data.limites.max ? '#ffeb3b' : '#78909c';
        }
        return '#ff9800';
      };
      
      const icono = getIcono();
      const color = getColor();
      
      
      let descripcion = '';
      
      const cicloInfo = data.ciclo ? 
        `<span style="color: #9c27b0;"><strong>Ciclo:</strong> ${data.ciclo}</span>` : '';
        
      
      const mudaInfo = data.tipo_sensor === 'humedad' && data.estado_muda !== undefined ? 
        ` • <span style="color: #8bc34a;"><strong>Estado:</strong> ${data.estado_muda === 1 ? 'En muda' : 'Normal'}</span>` : '';
      
      if (data.valor < data.limites.min) {
        descripcion = `
          <div style="color: ${color}; margin-bottom: 5px;">
            <span style="font-size: 16px;">${icono} <strong>${tipo}</strong> por debajo del límite</span>
          </div>
          <div>
            Valor actual: <strong>${data.valor}${data.tipo_sensor === 'temperatura' ? '°C' : data.tipo_sensor === 'humedad' ? '%' : ''}</strong> 
            (Mínimo: <strong>${data.limites.min}</strong>) 
          </div>
          <div style="margin-top: 5px; font-size: 0.9em; color: #757575;">
            ${cicloInfo}${mudaInfo}
          </div>
        `;
      } else {
        descripcion = `
          <div style="color: ${color}; margin-bottom: 5px;">
            <span style="font-size: 16px;">${icono} <strong>${tipo}</strong> por encima del límite</span>
          </div>
          <div>
            Valor actual: <strong>${data.valor}${data.tipo_sensor === 'temperatura' ? '°C' : data.tipo_sensor === 'humedad' ? '%' : ''}</strong> 
            (Máximo: <strong>${data.limites.max}</strong>)
          </div>
          <div style="margin-top: 5px; font-size: 0.9em; color: #757575;">
            ${cicloInfo}${mudaInfo}
          </div>
        `;
      }
      
      // Crear objeto de notificación
      const alerta = {
        tipo,
        descripcion,
        timestamp: new Date().toISOString(),
        color: color, 
        icono: icono  
      };
      
      // Guardar y mostrar notificación para el usuario actual
      saveLocalNotification(alerta, currentUsername);
      setNotifications(prev => [alerta, ...prev]);
      
      // Texto plano para notificación push (sin HTML)
      const textoPlano = `${icono} ${tipo} ${data.valor < data.limites.min ? 'por debajo del límite' : 'por encima del límite'}: ${data.valor}${data.tipo_sensor === 'temperatura' ? '°C' : data.tipo_sensor === 'humedad' ? '%' : ''}`;
      showNotificacion(`🦎 ${tipo}`, textoPlano);
    });
    
    return () => socket.off("alerta-valor-critico");
  }, [currentUsername]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleNotificationClick = (idx) => {
    const updated = [...notifications];
    updated.splice(idx, 1);
    setNotifications(updated);
    
    const storageKey = currentUsername 
      ? `gecko_house_notifications_${currentUsername}`
      : 'gecko_house_notifications_guest';
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    setNotificationMenuVisible(false);
  };

  const markAllAsRead = () => {
    clearLocalNotifications(currentUsername);
    setNotifications([]);
  };

  const handleClickOutside = (event) => {
    if (
      !event.target.closest(".dropdown-menu") &&
      !event.target.closest('[alt="Notificaciones"]') &&
      !event.target.closest('[alt="Usuario"]')
    ) {
      setNotificationMenuVisible(false);
      setMenuVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notificationMenuVisible, menuVisible]);

  const getTimeElapsed = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const getNotificationStyle = (notif) => {
    if (notif.color) {
      return {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderLeft: `4px solid ${notif.color}`,
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        borderRadius: "4px",
        margin: "5px 0",
        padding: "10px"
      };
    }
    return { backgroundColor: "rgba(235,245,255,0.5)" };
  };

  return (
    <NavBar ref={headerRef}>
      <LogoImg src={logo} alt="Logo" onClick={() => navigate("/")} />

      <NavContent>
        <Menu>
          <MenuItem onClick={() => navigate("/")}>Inicio</MenuItem>
          <MenuItem onClick={() => navigate("/dashboard")}>Monitoreo y Control</MenuItem>
          <MenuItem onClick={() => navigate("/historial")}>Historial</MenuItem>
        </Menu>
      </NavContent>

      <RightSection>
        {isAuthenticated ? (
          <>
            <NotificationIconContainer>
              <UserName>{username}</UserName>
              <IconButton
                src={notificationIcon}
                alt="Notificaciones"
                onClick={() => setNotificationMenuVisible(!notificationMenuVisible)}
              />
              {notifications.length > 0 && (
                <NotificationBadge>{notifications.length}</NotificationBadge>
              )}
              {notificationMenuVisible && (
                <NotificationDropdown className="dropdown-menu">
                  <NotificationHeader>
                    Notificaciones
                    {notifications.length > 0 && (
                      <span
                        onClick={markAllAsRead}
                        style={{ cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        Marcar todas
                      </span>
                    )}
                  </NotificationHeader>
                  {notifications.length > 0 ? (
                    notifications.map((notif, idx) => (
                      <NotificationItem
                        key={idx}
                        onClick={() => handleNotificationClick(idx)}
                        style={getNotificationStyle(notif)}
                      >
                        <NotificationTitle>
                          <UnreadIndicator read={false} />
                          {notif.icono} {notif.tipo}
                        </NotificationTitle>
                        <NotificationDescription dangerouslySetInnerHTML={{ __html: notif.descripcion }} />
                        <small style={{ color: "#777" }}>{getTimeElapsed(notif.timestamp)}</small>
                      </NotificationItem>
                    ))
                  ) : (
                    <NoNotifications>No tienes notificaciones</NoNotifications>
                  )}
                </NotificationDropdown>
              )}
            </NotificationIconContainer>

            <IconButton
              src={userIcon}
              alt="Usuario"
              onClick={() => setMenuVisible(!menuVisible)}
              style={{ marginRight: "20px" }}
            />
            {menuVisible && (
              <DropdownMenu className="dropdown-menu">
                <DropdownMenuItem onClick={() => navigate("/editar-datos")}>Editar datos</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
              </DropdownMenu>
            )}
          </>
        ) : (
          <LoginButton onClick={() => navigate("/login")} style={{ marginRight: "20px" }}>
            Iniciar sesión
          </LoginButton>
        )}
      </RightSection>
    </NavBar>
  );
};

export default Header;