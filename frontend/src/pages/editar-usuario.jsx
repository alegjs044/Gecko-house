import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";
import {jwtDecode} from "jwt-decode";

import {
Container,
RegisterBox,
Title,
Label,
StyledGecko,
StyledPlanta,
} from "../styles/editarStyles";

const Edit_User = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [Usuario, setUsername] = useState("");
  const [Contrasena, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  //Recuperar datos del usuario - inicio de sesion
  let username = '';
  let correo = '';
      
  const token = localStorage.getItem("token");
  
  if (token) {
    const decoded = jwtDecode(token); // Necesitas la librería jwt-decode
    username = decoded.user;
    correo = decoded.email;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!Usuario || !Contrasena || !confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (Contrasena !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No se ha iniciado sesión");
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/edit-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          Usuario, 
          Contrasena,
          token // Enviamos el token como parte del cuerpo de la solicitud
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        return;
      }

      // Guardar el nuevo token en localStorage si existe en la respuesta
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Actualización exitosa, redirigir al dashboard
      alert("Usuario actualizado correctamente");
      navigate("/dashboard");
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
          <Title>EDITAR DATOS {correo}</Title>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <Label>Usuario</Label>
            <InputField
              type="text"
              placeholder={username}
              value={Usuario}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Label>Contraseña</Label>
            <InputField
              type="password"
              placeholder="Ingresa una nueva contraseña"
              value={Contrasena}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Label>Confirmar Contraseña</Label>
            <InputField
              type="password"
              placeholder="Confirma la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button text="GUARDAR CAMBIOS" type="submit" />
          </form>
        </RegisterBox>
      </Container>

      <Footer />
    </>
  );
};

export default Edit_User;
