import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import planta from "../assets/planta.png";
import gecko from "../assets/reptil-gecko.png";
import axios from "axios";

import {
  Container,
  Title,
  Message,
  Box,
  StyledGecko,
  StyledPlanta
} from "../styles/recuperarStyles";

const RecoverPassword = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const response = await axios.post("http://localhost:5004/api/recover-password", { email });
      setMsg(response.data.msg);
      setSuccess(true);
      setEmail("");
    } catch (error) {
      setSuccess(false);
      if (error.response?.data?.msg) {
        setMsg(error.response.data.msg);
      } else {
        setMsg("Hubo un error al enviar el correo. Inténtalo de nuevo.");
      }
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
          <Title>Recuperación de Contraseña</Title>
          <p>Ingresa tu correo electrónico para recibir instrucciones</p>

          <form onSubmit={handleSubmit}>
            <InputField
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button text={loading ? "Enviando..." : "Enviar"} type="submit" disabled={loading} />
          </form>

          {msg && <Message success={success}>{msg}</Message>}
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default RecoverPassword;
