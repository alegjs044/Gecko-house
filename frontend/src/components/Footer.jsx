import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background-color: #B4864D;
  padding: 20px;
  text-align: center;
  width: 100vw; 
  right: 0;
  z-index: 100;
  color: white;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
`;

const FooterLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: bold;
  &:hover {
    text-decoration: underline;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <p>© 2024 Todos los Derechos Reservados</p>
      <FooterLinks>
        {}
        <FooterLink href="#">Términos</FooterLink>
        <FooterLink href="#">Privacidad</FooterLink>
        <FooterLink href="#">Cookies</FooterLink>
      </FooterLinks>
    </FooterContainer>
  );
};

export default Footer;
