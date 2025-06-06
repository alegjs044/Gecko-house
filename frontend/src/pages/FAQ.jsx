import React, { useState } from "react";
import styled from "styled-components";
import gecko from "../assets/gecko.png"; // asegúrate que el nombre/ruta es correcta

const Container = styled.div`
  padding: 120px 20px 60px;
  max-width: 800px;
  margin: auto;
  background: linear-gradient(180deg, #fffaf4, #f6e9d7);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(99, 74, 35, 0.1);
  position: relative;
  z-index: 2;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 40px;
  font-size: 34px;
  font-weight: 700;
  color: #634a23;
`;

const FAQItem = styled.div`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(99, 74, 35, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
  transition: transform 0.2s;
  border-left: 5px solid #ec8913;

  &:hover {
    transform: scale(1.01);
  }
`;

const Question = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  font-size: 17px;
  font-weight: 600;
  color: #634a23;
  background: rgba(236, 137, 19, 0.07);
`;

const Icon = styled.span`
  font-size: 22px;
`;

const Answer = styled.div`
  padding: 0 20px 18px;
  color: #333;
  line-height: 1.6;
  font-size: 15px;
  animation: fade 0.3s ease-in-out;

  @keyframes fade {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StaticGecko = styled.img`
  position: fixed;
  margin-top: -600px;
  left:80%;
  width: 380px;
  z-index: 1;
  pointer-events: none;
  opacity: 0.95;
`;


const faqs = [
  {
    icon: "📡",
    question: "¿Cómo puedo monitorear mi terrario?",
    answer: "La plataforma muestra los valores más recientes de los sensores y permite establecer alertas automáticas."
  },
  {
    icon: "⚙️",
    question: "¿Puedo controlar los dispositivos remotamente?",
    answer: "Sí. Puedes activar la lámpara UV, humidificador o placa térmica desde el panel."
  },
  {
    icon: "🌐",
    question: "¿Requiere conexión a Internet?",
    answer: "Sí, necesita Wi-Fi para enviar datos al servidor y recibir comandos remotos."
  },
  {
    icon: "🛠️",
    question: "¿Qué hago si el sistema no responde?",
    answer: "Verifica que esté conectado a la red, reinicia el dispositivo y si persiste, contacta soporte."
  },
  {
    icon: "🔋",
    question: "¿Qué pasa si se corta la energía?",
    answer: "El sistema se reiniciará al volver la energía, pero es recomendable usar respaldo eléctrico (UPS)."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <Container>
        <Title>Preguntas Frecuentes</Title>
        {faqs.map((item, idx) => (
          <FAQItem key={idx}>
            <Question onClick={() => setOpenIndex(openIndex === idx ? null : idx)}>
              <Icon>{item.icon}</Icon> {item.question}
            </Question>
            {openIndex === idx && <Answer>{item.answer}</Answer>}
          </FAQItem>
        ))}
      </Container>

      {/* Gecko fijo en la esquina inferior derecha */}
      <StaticGecko src={gecko} alt="gecko observando" />
    </>
  );
};


export default FAQ;
