import React, { useState } from "react"; 
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import gecko from "../assets/reptil-gecko.png";
import planta from "../assets/planta.png";
import img1 from "../assets/Montaje.png"; 
import img2 from "../assets/GL.png"; 
import img3 from "../assets/Circuit2sensores.png"; 

import {
  Container,
  ContentWrapper,
  SectionContainer,
  Section,
  SectionImage,
  Title,
  Button,
  InfoContainer,
  InfoTitle,
  InfoText,
  InfoButton,
  StyledGecko,
  StyledPlanta
} from "../styles/HomeStyles";


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