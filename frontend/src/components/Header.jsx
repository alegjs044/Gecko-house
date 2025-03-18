import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import notificationIcon from "../assets/campana.png";
import userIcon from "../assets/usuario.png";
import {jwtDecode} from "jwt-decode";


const NavBar = styled.nav`
  background-color: #B4864D;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 100;
  box-sizing: border-box;
`;

const LogoImg = styled.img`
  width: 50px;
  cursor: pointer;
`;

const NavContent = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
`;

const Menu = styled.ul`
  display: flex;
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const MenuItem = styled.li`
  font-weight: bold;
  cursor: pointer;
  color: white;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
`;

const IconButton = styled.img`
  width: 40px;
  height: 40px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
  }
`;

const LoginButton = styled.button`
  padding: 10px 15px;
  background-color: white;
  color: black;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  white-space: nowrap;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  overflow: hidden;
  z-index: 100;
`;

const DropdownMenuItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;


// Nuevos componentes para las notificaciones
const NotificationDropdown = styled(DropdownMenu)`
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  right: ${props => props.position || "0"};
`;

const NotificationItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #eaeaea;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
`;

const NotificationDescription = styled.div`
  font-size: 0.9rem;
  color: #555;
`;

const NotificationTime = styled.span`
  font-size: 0.8rem;
  color: #999;
`;

const UnreadIndicator = styled.div`
  width: 8px;
  height: 8px;
  background-color: #E74C3C;
  border-radius: 50%;
  margin-right: 10px;
  display: ${props => (props.read ? "none" : "block")};
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #E74C3C;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
`;

const NotificationHeader = styled.div`
  padding: 15px;
  font-weight: bold;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
`;

const NotificationIconContainer = styled.div`
  position: relative;
`;

const NoNotifications = styled.div`
  padding: 20px;
  text-align: center;
  color: #777;
`;

// Estilo para el nombre de usuario
const UserName = styled.span`
  margin-right: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;



const Header = ({ setHeaderHeight = () => {} }) => {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  let username = '';
  
  const token = localStorage.getItem("token");

  if (token) {
    const decoded = jwtDecode(token); // Necesitas la librería jwt-decode
    username = decoded.user;
    console.log(username);
  }
  
  
  // Estado para las notificaciones
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Alerta de temperatura',
      description: 'La temperatura ha superado el umbral establecido',
      dateTime: '2 días atrás',
      read: false,
    },
    {
      id: 2,
      title: 'Humedad crítica',
      description: 'La humedad está por debajo del nivel recomendado',
      dateTime: '5 días atrás',
      read: true,
    },
    {
      id: 3,
      title: 'Mantenimiento programado',
      description: 'Se ha programado mantenimiento para el próximo lunes',
      dateTime: '1 mes atrás',
      read: false,
    },
  ]);

  

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [setHeaderHeight]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  // Función para manejar el clic en una notificación
  const handleNotificationClick = (notificationId) => {
    // Marcar la notificación como leída
    setNotifications(
      notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // Aquí podrías navegar a una página de detalles de la notificación
    // Por ejemplo: navigate(`/notificaciones/${notificationId}`);
    
    // Para este ejemplo, simplemente cerramos el menú
    setNotificationMenuVisible(false);
  };

  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notif => ({ ...notif, read: true }))
    );
  };

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Cerrar menús al hacer clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationMenuVisible || menuVisible) {
        // Si el clic no fue dentro de un menú desplegable o en los iconos, cerrar los menús
        if (!event.target.closest('.dropdown-menu') && 
            !event.target.matches('[alt="Notificaciones"]') && 
            !event.target.matches('[alt="Usuario"]')) {
          setNotificationMenuVisible(false);
          setMenuVisible(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [notificationMenuVisible, menuVisible]);

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
              <IconButton 
                src={notificationIcon} 
                alt="Notificaciones" 
                onClick={() => {
                  setNotificationMenuVisible(!notificationMenuVisible);
                  setMenuVisible(false);
                }}
              />
              {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
              
              {notificationMenuVisible && (
                <NotificationDropdown className="dropdown-menu" position="60px">
                  <NotificationHeader>
                    Notificaciones
                    {unreadCount > 0 && (
                      <span 
                        style={{ fontSize: '0.8rem', color: '#5a5a5a', cursor: 'pointer' }}
                        onClick={markAllAsRead}
                      >
                        Marcar todas como leídas
                      </span>
                    )}
                  </NotificationHeader>
                  
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <NotificationItem 
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <NotificationTitle>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <UnreadIndicator read={notification.read} />
                            {notification.title}
                          </div>
                          <NotificationTime>{notification.timestampReceived}</NotificationTime>
                        </NotificationTitle>
                        <NotificationDescription>
                          {notification.description}
                        </NotificationDescription>
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
              onClick={() => {
                setMenuVisible(!menuVisible);
                setNotificationMenuVisible(false);
              }}
            />
            
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