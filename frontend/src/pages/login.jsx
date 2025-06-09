import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";

import {
  Container,
  Title,
  Label,
  LoginBox,
  ForgotPassword,
  StyledGecko,
  StyledPlanta,
} from "../styles/loginStyles";

const Login = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [Usuario, setUsername] = useState("");
  const [Contrasena, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("usuario");
    const passParam = params.get("clave");
    if (userParam) setUsername(userParam);
    if (passParam) setPassword(passParam);
  }, []);


const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  if (!Usuario || !Contrasena) {
    Swal.fire("Campos requeridos", "Todos los campos son obligatorios", "warning");
    setIsLoading(false);
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Usuario, Contrasena }),
    });

    const data = await response.json();

    if (!response.ok || !data.token || !data.ID_usuario) {
      Swal.fire("Error", data.error || "Usuario o contraseña incorrectos", "error");
      setIsLoading(false);
      return;
    }

    const userData = {
      ID_usuario: data.ID_usuario,
      nombre: data.Nombre || data.Usuario,
      correo: data.Correo,
      temporal: data.temporal,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("userData", JSON.stringify(userData));

    Swal.fire({
      title: "¡Bienvenido!",
      text: "Inicio de sesión exitoso",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate(userData.temporal ? "/personalizar" : "/dashboard");
    });

  } catch (error) {
    Swal.fire("Error", "No se pudo conectar al servidor", "error");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <>
      <Header setHeaderHeight={setHeaderHeight} hideLoginButton={true} />

      <Container headerHeight={headerHeight}>
        <StyledGecko src={gecko} alt="Gecko" />
        <StyledPlanta src={planta} alt="Planta" />

        <LoginBox>
          <Title>INICIO DE SESIÓN</Title>

          <form onSubmit={handleSubmit}>
            <Label>Usuario</Label>
            <InputField
              type="text"
              placeholder="Ingresa tu usuario"
              value={Usuario}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />

            <Label>Contraseña</Label>
            <InputField
              type="password"
              placeholder="Ingresa tu contraseña"
              value={Contrasena}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <ForgotPassword onClick={() => navigate("/recuperar")}>
              ¿Olvidaste tu contraseña?
            </ForgotPassword>

            <Button 
              text={isLoading ? "INICIANDO SESIÓN..." : "INICIAR SESIÓN"} 
              type="submit" 
              disabled={isLoading}
            />
          </form>
        </LoginBox>
      </Container>

      <Footer />
    </>
  );
};

export default Login;