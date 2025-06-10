import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";
import axios from "axios";

import {
  Container,
  Title,
  StyledGecko,
  StyledPlanta,
  Box,
  Message,
} from "../styles/resetStyles";

const ResetPassword = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Token inválido o ausente.");
      setError(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5004/api/reset-password", {
        token,
        newPassword: password,
      });

      setMessage(res.data.msg);
      setError(false);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.msg || "Error al restablecer la contraseña.";
      setMessage(msg);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header setHeaderHeight={setHeaderHeight} hideLoginButton={true} />

      <Container headerHeight={headerHeight}>
        <StyledGecko src={gecko} alt="Gecko" />
        <StyledPlanta src={planta} alt="Planta" />

        <Box>
          <Title>Restablecer Contraseña</Title>

          <form onSubmit={handleSubmit}>
            <InputField
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputField
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button text={loading ? "Enviando..." : "Guardar nueva contraseña"} type="submit" disabled={loading} />
          </form>

          {message && <Message error={error}>{message}</Message>}
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default ResetPassword;
