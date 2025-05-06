import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import planta from "../assets/planta.png";
import gecko from "../assets/reptil-gecko.png";
import VerIcon from "../assets/ver.png";
import OjoCerradoIcon from "../assets/ojo-cerrado.png";

import {
  Container,
  Title,
  RegisterBox,
  StyledGecko,
  StyledPlanta,
  Label
} from "../styles/registroStyles";

const Personalizar = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [Usuario, setUsuario] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Correo, setCorreo] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData || !userData.temporal) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!Usuario || !Contrasena || !Correo) {
      Swal.fire("Campos requeridos", "Todos los campos son obligatorios", "warning");
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo);
    if (!correoValido) {
      Swal.fire("Correo inválido", "Ingresa un correo válido", "warning");
      return;
    }

    const contrasenaSegura = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(Contrasena);
    if (!contrasenaSegura) {
      Swal.fire(
        "Contraseña insegura",
        "Debe tener al menos 6 caracteres, una letra y un número",
        "warning"
      );
      return;
    }

    if (!Usuario.trim()) {
      const sugerido = Correo.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      setUsuario(sugerido);
      Swal.fire("Sugerencia de usuario", `sugerido: ${sugerido}`, "info");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/edit-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Usuario, Contrasena, Correo, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire("Error", data.error || "No se pudo actualizar", "error");
        return;
      }

      localStorage.setItem("token", data.token);
      const userData = JSON.parse(localStorage.getItem("userData"));
      localStorage.setItem("userData", JSON.stringify({
        ...userData,
        nombre: Usuario,
        correo: Correo,
        temporal: false,
      }));

      Swal.fire("¡Listo!", "Tu cuenta ha sido personalizada", "success").then(() => {
        navigate("/dashboard");
      });

    } catch (error) {
      console.error("❌ Error al personalizar:", error);
      Swal.fire("Error", "No se pudo conectar al servidor", "error");
    }
  };

  return (
    <>
      <Header setHeaderHeight={setHeaderHeight} hideLoginButton={true} />

      <Container headerHeight={headerHeight}>
        <StyledGecko src={gecko} alt="Gecko" />
        <StyledPlanta src={planta} alt="Planta" />

        <RegisterBox>
          <Title>Personaliza tu cuenta</Title>
          <p style={{ marginBottom: "20px", fontWeight: "bold", color: "#333" }}>
            ¡Bienvenido a <span style={{ color: "#d97706" }}>Gecko House</span>! Personaliza tus datos para comenzar.
          </p>

          <form onSubmit={handleSubmit}>
            <Label>Nuevo Usuario</Label>
            <InputField
              type="text"
              placeholder="Ej. juan_gomez"
              value={Usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />

            <Label>Nueva Contraseña</Label>
            <div style={{ position: "relative" }}>
              <InputField
                type={verContrasena ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={Contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                style={{ paddingRight: "40px" }}
              />
              <img
                src={verContrasena ? OjoCerradoIcon : VerIcon}
                alt="toggle"
                onClick={() => setVerContrasena(!verContrasena)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  opacity: 0.7
                }}
              />
            </div>

            <Label>Correo</Label>
            <InputField
              type="email"
              placeholder="correo@ejemplo.com"
              value={Correo}
              onChange={(e) => setCorreo(e.target.value)}
            />

            <Button text="GUARDAR CAMBIOS" type="submit" />
          </form>
        </RegisterBox>
      </Container>

      <Footer />
    </>
  );
};

export default Personalizar;
