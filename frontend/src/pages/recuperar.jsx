import React, { useState } from "react";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";

const Container = styled.div`
  border-radius: 20px;
  width: 80%;
  max-width: 500px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  background: white;
`;

const Title = styled.h2`
  color: black;
  margin-bottom: 15px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  margin-top: 10px;
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const RecoverPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/recover-password", { email });
      alert(response.data.msg); // Mensaje desde el backend
      setEmail("");
    } catch (error) {
      alert("Hubo un error al enviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Container>
        <Title>Recuperación de Contraseña</Title>
        <p>Ingresa tu correo electrónico para recibir instrucciones</p>
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </Container>
      <Footer />
    </>
  );
};

export default RecoverPassword;
