import React, { useState } from "react";
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
  RegisterLink,
  ForgotPassword,
  StyledGecko,
  StyledPlanta,
} from "../styles/loginStyles";

const Login = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [Usuario, setUsername] = useState("");
  const [Contrasena, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!Usuario || !Contrasena) {
      Swal.fire("Campos requeridos", "Todos los campos son obligatorios", "warning");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Usuario, Contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire("Error", data.error || "Usuario o contraseña incorrectos", "error");
        return;
      }

      // Guardar token
      localStorage.setItem("token", data.token);

      // Guardar usuario completo
      if (data.ID_usuario) {
        localStorage.setItem("userData", JSON.stringify({
          ID_usuario: data.ID_usuario,
          nombre: data.Nombre || data.Usuario || "Usuario",
          correo: data.Correo || "Sin correo",
        }));
      }

      Swal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate("/dashboard");
      });

    } catch (error) {
      console.error("❌ Error de conexión:", error);
      Swal.fire("Error de conexión", "No se pudo conectar al servidor", "error");
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
            />

            <Label>Contraseña</Label>
            <InputField
              type="password"
              placeholder="Ingresa tu contraseña"
              value={Contrasena}
              onChange={(e) => setPassword(e.target.value)}
            />

            <ForgotPassword onClick={() => navigate("/recuperar")}>
              ¿Olvidaste tu contraseña?
            </ForgotPassword>

            <Button text="INICIAR SESIÓN" type="submit" />

            <RegisterLink onClick={() => navigate("/registro")}>
              ¿No tienes cuenta? Regístrate aquí
            </RegisterLink>
          </form>
        </LoginBox>
      </Container>

      <Footer />
    </>
  );
};

export default Login;
