import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const NavBar = styled.nav`
  background-color: #B4864D;
  display: flex;
  justify-content: center; /* Centra el contenido */
  align-items: center;
  padding: 10px 20px;
  position: fixed;
  width: 100vw; 
  left: 0; 
  top: 0;
  z-index: 100;
`;

const NavContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;  
  margin: auto; 
`;

const LogoImg = styled.img`
  width: 50px;
`;

const Menu = styled.ul`
  display: flex;
  list-style: none;
  gap: 20px;
  flex-grow: 1;  
  justify-content: center; 
  margin: 0;
  padding: 0;
`;

const MenuItem = styled.li`
  font-weight: bold;
  cursor: pointer;
  color: white;

  &:hover {
    text-decoration: underline;
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

const Header = ({ setHeaderHeight = () => {}, hideLoginButton = false }) => {
    const headerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, [setHeaderHeight]);

    return (
        <NavBar ref={headerRef}>
            <NavContent>
                <LogoImg src={logo} alt="Logo" />
                <Menu>
                    <MenuItem onClick={() => navigate("/")}>Inicio</MenuItem>
                    <MenuItem onClick={() => navigate("/dashboard")}>Centro de monitoreo y control</MenuItem>
                    <MenuItem onClick={() => navigate("/historial")}>Historial de datos</MenuItem>
                </Menu>
                {!hideLoginButton && (
                    <LoginButton onClick={() => navigate("/login")}>
                        Iniciar sesión
                    </LoginButton>
                )}
            </NavContent>
        </NavBar>
    );
};

export default Header;
