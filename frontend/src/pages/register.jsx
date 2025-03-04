import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";

const Container = styled.div`
  padding-top: ${(props) => props.headerHeight + 40}px;
  padding-left: 40px;
  padding-right: 40px;
  padding-bottom: 75px;
  background: white;
  border-radius: 20px;
  width: 80%;
  max-width: 500px;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RegisterBox = styled.div`
  background: linear-gradient(90deg, rgba(239,191,134,0.51) 0%, rgba(236,137,19,0.5) 51%, rgba(239,191,134,0.5) 100%);
  padding: 30px;
  border-radius: 30px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 90%;
`;

const Title = styled.h2`
  color: black;
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin: 10px 0 5px;
  font-weight: bold;
  color: black;
`;

const LoginLink = styled.a`
  display: block;
  margin-top: 10px;
  color: blue;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledGecko = styled.img`
  position: absolute;
  top: 14%;
  left: 76%;
  width: 250px;
  filter: brightness(50%);
`;

const StyledPlanta = styled.img`
  position: absolute;
  bottom: 1%;
  left: 33%;
  width: 200px;
`;

const Register = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }

      // Registro exitoso, redirigir al login
      navigate("/login");
    } catch (error) {
      setError("Error en la conexión con el servidor");
    }
  };

  return (
    <>
      <Header setHeaderHeight={setHeaderHeight} hideLoginButton={true} />

      <Container headerHeight={headerHeight}>
        <StyledGecko src={gecko} alt="Gecko" />
        <StyledPlanta src={planta} alt="Planta" />

        <RegisterBox>
          <Title>REGISTRO</Title>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <Label>Usuario</Label>
            <InputField
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Label>Correo Electrónico</Label>
            <InputField
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label>Contraseña</Label>
            <InputField
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Label>Confirmar Contraseña</Label>
            <InputField
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <LoginLink onClick={() => navigate("/login")}>
              ¿Ya tienes cuenta? Inicia sesión
            </LoginLink>

            <Button text="REGISTRARSE" type="submit" />
          </form>
        </RegisterBox>
      </Container>

      <Footer />
    </>
  );
};


export default Register;
