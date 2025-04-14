import React from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
  text-align: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  background: red;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
`;
  

  const Modal = ({ show, onClose, content }) => {
    if (!show) return null;
  
    return (
      <Overlay onClick={onClose}>
        <ModalBox onClick={(e) => e.stopPropagation()}> {}
          <p>{content}</p>
          <CloseButton onClick={onClose}>Cerrar</CloseButton>
        </ModalBox>
      </Overlay>
    );
  };
  
export default Modal;
