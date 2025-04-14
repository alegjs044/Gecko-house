import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";

import {
  Container,
  Title,
  RegisterBox,
  StyledGecko,
  LoginLink,
  Label,
  StyledPlanta
} from "../styles/registroStyles";

const Register = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [Usuario, setUsername] = useState("");
  const [Correo, setEmail] = useState("");
  const [Contrasena, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!Usuario || !Correo || !Contrasena || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (Contrasena!== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          Usuario, Correo, Contrasena
        }),
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
              value={Usuario}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Label>Correo Electrónico</Label>
            <InputField
              type="email"
              placeholder="Ingresa tu correo"
              value={Correo}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label>Contraseña</Label>
            <InputField
              type="password"
              placeholder="Ingresa tu contraseña"
              value={Contrasena}
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
