import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";  
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";

const Container = styled.div`
  padding-top: 100px;
  background: white;
  border-radius: 20px;
  width: 80%;
  max-width: 500px;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  text-align: center;
  padding: 30px;
`;

const Title = styled.h2`
  color: black;
  margin-bottom: 15px;
`;

const RecoverPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Se ha enviado un correo con instrucciones.");
    navigate("/login");
  };

  return (
    <>
      <Header />
      <Container>
        <Title>Recuperación de Contraseña</Title>
        <p>Ingresa tu correo electrónico para recibir instrucciones</p>
        <form onSubmit={handleSubmit}>
          <InputField
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button text="ENVIAR" />
        </form>
      </Container>
      <Footer />
    </>
  );
};

export default RecoverPassword;
