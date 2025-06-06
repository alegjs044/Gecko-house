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
              <Button
  onClick={() =>
    openModal(
      <>
        <p>Este sistema fue desarrollado como un prototipo de monitoreo y control automatizado para terrarios que alojan geckos leopardo, una especie de reptil exótico que requiere condiciones ambientales muy específicas para su bienestar.</p>
        <p>A través de una plataforma web, los usuarios pueden supervisar en tiempo real las condiciones del terrario, recibir alertas ante cambios críticos y ajustar parámetros remotamente.</p>
        <p>Esta solución busca facilitar el cuidado responsable de reptiles en cautiverio y prevenir enfermedades derivadas de un mal acondicionamiento del hábitat.</p>
        <p>Con esta herramienta, se promueve una convivencia más segura y saludable entre humanos y animales exóticos.</p>
      </>
    )
  }
>
  Leer Más
</Button>


            </Section>

            <Section>
              <SectionImage src={img2} alt="Gecko Leopardo" />
              <Title>GECKO LEOPARDO [INFORMACIÓN GENERAL]</Title>
              <Button
  onClick={() =>
    openModal(
      <>
        <p><strong>El Gecko Leopardo</strong> (<em>Eublepharis macularius</em>) es un tipo de gecónido, un reptil escamoso perteneciente a la familia de las lagartijas, pero de mayor tamaño.</p>
        <p>Es una especie <strong>nocturna o crepuscular</strong>, lo que significa que está activa principalmente durante el amanecer y el anochecer.</p>
        <p>Este gecko es originario de las regiones <strong>áridas y semiáridas del sur de Asia</strong>.</p>
      </>
    )
  }
>
  Leer Más
</Button>

            </Section>

            <Section>
              <SectionImage src={img3} alt="Instrumentos de control" />
              <Title>INSTRUMENTOS DE CONTROL PARA EL TERRARIO</Title>
              <Button
  onClick={() =>
    openModal(
      <>
        <p>
          El sistema de monitoreo y control usa un <strong>SoC</strong>, que integra <strong>microprocesador</strong>, <strong>memoria</strong>, <strong>interfaces de comunicación</strong> y <strong>pines de entrada/salida</strong>.
        </p>
        <p>
          El <strong>microcontrolador ESP32-S3</strong> está basado en el <strong>procesador Xtensa LX7</strong> de <strong>32 bits</strong> y soporta <strong>tareas en paralelo</strong>, con conectividad <strong>Wi-Fi</strong> y <strong>Bluetooth</strong>.
        </p>
        <p>
          La placa <strong>Arduino Nano ESP32-S3</strong> facilita la conexión de <strong>sensores</strong> y <strong>actuadores</strong> gracias a sus buses <strong>I2C</strong>, <strong>SPI</strong> y <strong>convertidores ADC</strong>.
        </p>
        <p>
          Los <strong>periféricos externos</strong> incluyen un <strong>display OLED</strong> y un <strong>teclado</strong> para interacción con el usuario.
        </p>
        <p>
          Los <strong>actuadores</strong> permiten modificar el ambiente, como la <strong>placa térmica</strong>, <strong>humidificador</strong> y <strong>focos UV</strong>.
        </p>
        <p>
          Los <strong>sensores</strong> recopilan datos físicos como <strong>temperatura</strong> (<strong>DS18B20</strong>, <strong>DHT22</strong>), <strong>humedad</strong> y <strong>radiación UV</strong> (<strong>ML8511</strong>).
        </p>
        <p>
          Todo el sistema está orientado a mantener condiciones óptimas para un <strong>gecko leopardo</strong>.
        </p>
      </>
    )
  }
>
  Leer Más
</Button>

            </Section>
          </SectionContainer>

          {}
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