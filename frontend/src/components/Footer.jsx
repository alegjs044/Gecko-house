import React from "react";
import styled from "styled-components";

// Añade este componente para crear espacio entre el contenido y el footer
export const ContentContainer = styled.div`
  margin-bottom: 75px; 
`;

const FooterContainer = styled.footer`
  background: rgb(99,74,35);
  background: -moz-linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  background: -webkit-linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  background: linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#634a23",endColorstr="#926539",GradientType=1);
  padding: 11px 11px; 
  text-align: center;
  width: 100%;
  color: white;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: auto; 
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 5px; 
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
  font-size: 14px; 
  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: white;
  margin: 5px 0; 
`;

const FooterText = styled.p`
  margin: 0;
  font-size: 12px; 
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