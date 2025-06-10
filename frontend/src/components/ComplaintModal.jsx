import React, { useState } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;
`;

const ModalBox = styled.div`
  background: white;
  padding: 20px;
  width: 90%;
  max-width: 700px;
  border-radius: 8px;
`;

const Input = styled.input`
  width: 95%;
  margin-bottom: 10px;
  padding: 10px;
`;

const TextArea = styled.textarea`
  width: 95%;
  height: 150px;
  margin-bottom: 10px;
  padding: 10px;
`;

const ModalButton = styled.button`
  background: #634a23;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
`;

const ComplaintModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    try {
      const res = await fetch("http://localhost:5004/api/send-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });

      if (res.ok) {
        alert("Mensaje enviado con éxito.");
        onClose();
      } else {
        alert("Error al enviar el mensaje.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  return (
  <ModalOverlay>
      <ModalBox>
        <h3>Enviar mensaje de soporte</h3>
        <Input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextArea
          placeholder="Describe tu problema o duda..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <ModalButton onClick={handleSend}>Enviar</ModalButton>
        <ModalButton onClick={onClose} style={{ marginLeft: '10px', background: 'gray' }}>
          Cancelar
        </ModalButton>
      </ModalBox>
    </ModalOverlay>
  );
};

export default ComplaintModal;
