import React, { useState } from "react"; 
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";
import img1 from "../assets/Montaje.png"; 
import img2 from "../assets/GL.png"; 
import img3 from "../assets/Circuit2sensores.png"; 

// Contenedor principal con ajuste dinámico del header
const Container = styled.div`
  padding-top: ${(props) => props.headerHeight + 40}px;
  padding-left: 40px;
  padding-right: 40px;
  padding-bottom: 75px;
  background: white;
  border-radius: 20px;
  width: 91%;
  max-width: 1200px;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;



const ContentWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 50px;
  width: 100%;
`;


const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 50%;
`;

// Cada tarjeta con fondo semitransparente
const Section = styled.div`
  background: rgb(239,191,134);
    background: -moz-linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236,137,19,0.4990371148459384) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    background: -webkit-linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236,137,19,0.4990371148459384) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    background: linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236,137,19,0.4990371148459384) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#efbf86",endColorstr="#efbf86",GradientType=1);
  padding: 15px;
  border-radius: 50px;
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5),
              10px 10px 20px rgba(245, 239, 230, 0.2); 
  backdrop-filter: blur(10000px); 
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3)); 
  border: 1px solid rgba(248, 216, 186, 0.25); 
  text-align: center;
  opacity: 1.2; 
  position: relative; 
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionImage = styled.img`
  width: 85%;
  border-radius: 15px;
  display: block;
  position: relative;
  z-index: 2;
  padding: 19px;
  opacity: 90%;
  `;

const Title = styled.h3`
  font-size: 26px;
  font-weight: bold;
  position: absolute;
  top: 40px; /* Ubica el texto arriba */
  font-size: 16px;
  font-weight: bold;
  position: absolute;
  top: 10px; /* Ubica el texto arriba */
  color: black;
  background: rgba(238, 228, 218, 0.93); /* Fondo semitransparente para resaltar */
  padding: 5px 10px;
  border-radius: 5px;
  z-index: 3; /* Asegura que esté sobre la imagen */
`;


const Button = styled.button`
  background: rgb(129, 53, 2);
  color: white;
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.3s;
  position: absolute; 
  bottom: 10px; 
  left: 50%;
  transform: translateX(-50%); 
  z-index: 4; 

  &:hover {
    background: #C35B1B;
  }
`;


// Contenedor de cuidados básicos 
const InfoContainer = styled.div`
  width: auto;
  max-width: 50%;
  background: rgba(239, 192, 134, 0.47);
    background: -moz-linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236, 138, 19, 0.25) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    background: -webkit-linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236,137,19,0.4990371148459384) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    background: linear-gradient(90deg, rgba(239,191,134,0.5102415966386555) 0%, rgba(236, 138, 19, 0.29) 51%, rgba(239,191,134,0.5046393557422969) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#efbf86",endColorstr="#efbf86",GradientType=1);
  padding: 30px;
  border-radius: 50px; 
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), 
              10px 10px 20px rgba(109, 67, 4, 0.2); 
  backdrop-filter: blur(500px); 
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 0.42)); 
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  opacity: 1.2;
  gap: 20px;
`;

const InfoTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
`;

const InfoText = styled.p`
  font-size: 18px;
  line-height: 1.5;
  margin: 10px 0;
`;


const InfoButton = styled(Button)`
  position: center;
  bottom: -20px; 
`;


const StyledGecko = styled.img`
  position: absolute;
  top: 14%;
  left: 76%;
  width: 250px;
  filter: brightness(50%); 
`;

const StyledPlanta = styled.img`
  position: absolute;
  bottom: 1%;
  left: 33;
  width: 200px;
`;

const Home = () => {
  const [modalContent, setModalContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0); 

  const openModal = (content) => {
    setModalContent(content);
    setModalVisible(true);
  };
  

  return (
    <>
      {}
      <Header setHeaderHeight={setHeaderHeight} />
      <Container headerHeight={headerHeight}>
        <ContentWrapper>
          {}
          <SectionContainer>
            <Section>
              <SectionImage src={img1} alt="Acerca del sistema" />
              <Title>ACERCA DEL SISTEMA</Title>
              <Button onClick={() => openModal("Más información sobre el sistema")}>Leer Más</Button>
            </Section>

            <Section>
              <SectionImage src={img2} alt="Gecko Leopardo" />
              <Title>GECKO LEOPARDO [INFORMACIÓN GENERAL]</Title>
              <Button onClick={() => openModal("Información general sobre el Gecko Leopardo")}>Leer Más</Button>
            </Section>

            <Section>
              <SectionImage src={img3} alt="Instrumentos de control" />
              <Title>INSTRUMENTOS DE CONTROL PARA EL TERRARIO</Title>
              <Button onClick={() => openModal("Detalles sobre los instrumentos de control")}>Leer Más</Button>
            </Section>
          </SectionContainer>

          {/* Sección de cuidados básicos */}
          <InfoContainer>
            <InfoTitle>CUIDADOS BÁSICOS</InfoTitle>
            <InfoText>
              <strong>Terrario:</strong> Necesitan un terrario con sustrato adecuado, escondites y una fuente de calor para mantener la temperatura adecuada.
            </InfoText>
            <InfoText>
              <strong>Alimentación:</strong> Se les debe alimentar con insectos y complementar su dieta con calcio y vitaminas.
            </InfoText>
            <InfoText>
              <strong>Hidratación:</strong> Aunque son animales del desierto, necesitan acceso a agua fresca y limpia.
            </InfoText>
            <InfoButton onClick={() => openModal("Más información sobre cuidados básicos")}>Leer Más</InfoButton>
          </InfoContainer>
        </ContentWrapper>

        {}
        <StyledGecko src={gecko} alt="Gecko" />
        <StyledPlanta src={planta} alt="Planta" />
      </Container>

      <Footer />
      
      {}
      <Modal show={modalVisible} onClose={() => setModalVisible(false)} content={modalContent} />
    </>
  );
};

export default Home;