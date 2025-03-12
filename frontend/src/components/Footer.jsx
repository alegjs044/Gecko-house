import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background-color: #B4864D;
  padding: 15px 20px;
  text-align: center;
  width: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 10px;
  gap: 5px;
`;

const FooterLeft = styled.div`
  display: flex;
  gap: 0px; 
  padding-left: 50px; 
`;

const FooterCenter = styled.div`
  display: flex;
  gap: 5px; 
`;

const FooterRight = styled.div`
  display: flex;
  gap: 0px; 
  padding-right: 50px; 
`;

const FooterLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 16px; // Reducimos el tamaño de la fuente si es necesario
  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: white;
  margin: 10px 0;
`;

const FooterText = styled.p`
  margin: 0;
  font-size: 14px;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterLeft>
          <FooterLink href="#">Soporte</FooterLink>
        </FooterLeft>
        <FooterCenter>
          <FooterLink href="#">Términos</FooterLink>
          <FooterLink href="#">Privacidad</FooterLink>
          <FooterLink href="#">Cookies</FooterLink>
        </FooterCenter>
        <FooterRight>
          <FooterLink href="#">FAQ</FooterLink>
        </FooterRight>
      </FooterContent>
      <Divider />
      <FooterText>© 2024 Todos los Derechos Reservados</FooterText>
    </FooterContainer>
  );
};

export default Footer;