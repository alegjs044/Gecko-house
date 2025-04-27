
import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 8px solid #eee;
  border-top: 8px solid #ff8c00;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`;

const LoadingText = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 1.2rem;
  color: #333;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
`;

const Loading = () => (
  <Container>
    <Spinner />
    <LoadingText>Cargando datos...</LoadingText>
  </Container>
);

export default Loading;
