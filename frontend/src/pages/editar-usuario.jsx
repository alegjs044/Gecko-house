// src/pages/Edit_User.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";

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
  const [Usuario, setUsuario] = useState("");
  const [Correo, setCorreo] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // Al montar, decodificamos y precargamos usuario + correo
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const { user, email } = jwtDecode(token);
      setUsuario(user);
      setCorreo(email);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!Usuario || !Correo || !Contrasena || !confirmPassword) {
      Swal.fire("Campos requeridos", "Todos los campos son obligatorios", "warning");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo)) {
      Swal.fire("Correo inválido", "Ingresa un correo válido", "warning");
      return;
    }
    if (Contrasena.length < 6 || !/[A-Za-z]/.test(Contrasena) || !/\d/.test(Contrasena)) {
      Swal.fire(
        "Contraseña insegura",
        "Debe tener al menos 6 caracteres, una letra y un número",
        "warning"
      );
      return;
    }
    if (Contrasena !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/edit-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario, Correo, Contrasena, token }),
      });
      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.error || "No se pudo actualizar", "error");
        return;
      }

      // Actualizar localStorage con nuevo token y datos
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("userData")),
          Nombre: Usuario,
          Correo,
          temporal: false,
        })
      );

      Swal.fire("¡Listo!", "Tus datos se han actualizado", "success").then(() =>
        navigate("/dashboard")
      );
    } catch (err) {
      console.error(err);
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
          <Title>EDITAR MIS DATOS</Title>
          <form onSubmit={handleSubmit}>
            <Label>Usuario</Label>
            <InputField
              type="text"
              value={Usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />

            <Label>Correo</Label>
            <InputField
              type="email"
              value={Correo}
              onChange={(e) => setCorreo(e.target.value)}
            />

            <Label>Nueva Contraseña</Label>
            <InputField
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={Contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />

            <Label>Confirmar Contraseña</Label>
            <InputField
              type="password"
              placeholder="Repite la contraseña"
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
