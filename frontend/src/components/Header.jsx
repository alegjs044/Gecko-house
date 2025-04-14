import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import notificationIcon from "../assets/campana.png";
import userIcon from "../assets/usuario.png";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { showNotificacion } from "../Utils/showNotificacion";
import { LIMITES } from "../constants/Limites";


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

const socket = io("http://localhost:5000");

const Header = ({ setHeaderHeight = () => {} }) => {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
  

  useEffect(() => {
    if (isAuthenticated) {
      const local = getLocalNotifications();
      setNotifications(local);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    socket.on("sensor-data", (data) => {
      const limites = {
        "terrario/zonafria": LIMITES.temperaturaFria,
        "terrario/zonacaliente": LIMITES.temperaturaCaliente,
      };
      
  
      const rango = limites[data.topic];
      if (rango && (data.valor < rango.bajo || data.valor > rango.alto)) {
        const tipo = data.topic.includes("fria") ? "Temperatura Zona Fría" : "Temperatura Zona Caliente";
        const descripcion = data.valor > rango.alto
          ? `⚠️ ${tipo} superó ${rango.alto}°C. Actual: ${data.valor}°C`
          : `⚠️ ${tipo} bajó de ${rango.bajo}°C. Actual: ${data.valor}°C`;
  
        const alerta = {
          tipo,
          descripcion,
          timestamp: new Date().toISOString(),
        };
  
        saveLocalNotification(alerta);
        setNotifications(prev => [alerta, ...prev]);
  
        
        showNotificacion(tipo, descripcion);
      }
    });
  
    return () => socket.off("sensor-data");
  }, []);
  

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleNotificationClick = (idx) => {
    const updated = [...notifications];
    updated.splice(idx, 1);
    setNotifications(updated);
    localStorage.setItem("visual_notifications", JSON.stringify(updated));
    setNotificationMenuVisible(false);
  };

  const markAllAsRead = () => {
    clearLocalNotifications();
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
                        style={{ backgroundColor: "rgba(235,245,255,0.5)" }}
                      >
                        <NotificationTitle>
                          <UnreadIndicator read={false} />
                          {notif.tipo}
                        </NotificationTitle>
                        <NotificationDescription>{notif.descripcion}</NotificationDescription>
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