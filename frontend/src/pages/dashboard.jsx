import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const Container = styled.div`
  padding: 50px 30px;
  margin: auto;
  max-width: 1400px;
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
  min-height: 85vh;
  align-items: stretch;
`;

const CardTitle = styled.h3`
  background: #093609;
  padding: 12px;
  border-radius: 10px;
  font-size: 18px;
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  text-align: center;
  color: white;
  z-index: 3;
`;


const ButtonGroup = styled.div`
  display: flex;
  gap: 50px;
  margin-top: 5px;
`;

const ModeButton = styled.button`
  background: ${({ active }) => (active ? "#093609" : "#E0E2E6")};
  color: ${({ active }) => (active ? "white" : "black")};
  font-family: "Roboto", sans-serif;
  font-weight: bold;
  padding: 6px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: #093609;
    color: white;
  }
`;


const SwitchContainer = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
`;


const SwitchWrapper = styled.div`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${({ checked }) => (checked ? "#4caf50" : "#ccc")};
  border-radius: 15px;
  transition: background-color 0.3s ease-in-out;
`;


const Slider = styled.div`
  position: absolute;
  top: 3px;
  left: ${({ checked }) => (checked ? "26px" : "3px")};
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease-in-out;
`;


const HiddenCheckbox = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

const CustomSwitch = ({ checked, onChange }) => {
  return (
    <SwitchContainer>
      <span>{checked ? "ON" : "OFF"}</span>
      <HiddenCheckbox
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
      />
      <SwitchWrapper checked={checked}>
        <Slider checked={checked} />
      </SwitchWrapper>
    </SwitchContainer>
  );
};


const Card = styled.div`
  background: rgba(123, 95, 61, 0.8);
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), /* Sombra interna */
              10px 10px 20px rgba(245, 239, 230, 0.2); /* Sombra externa */
  backdrop-filter: blur(10000px); /* Suaviza el fondo */
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3)); /* Efecto de profundidad */
  border: 1px solid rgba(248, 216, 186, 0.25); /* Borde suave */
  opacity: 1.2; /* Transparencia ligera */
  position: relative; /* Permite que el botón se posicione dentro */
  padding: 10px;
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  color: black;
  text-align: center;
  height: 80%;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: -81px;
  justify-content: center; 

`;

const MiniCard = styled.div`
  background: #EFBF86;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  color: black;
  text-align: center;
  width: 100%;
  margin-bottom: 10px;
`;


const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const CenterColumn = styled(Column)`
  justify-content: space-between;
`;

const RightColumn = styled(Column)`
  justify-content: space-between;
  height: 90%;
`;


const ControlPanel = styled(Card)`
  background: rgba(123, 95, 61, 0.8);
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), 
              10px 10px 20px rgba(245, 239, 230, 0.2); 
  backdrop-filter: blur(10000px);
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3)); 
  border: 1px solid rgba(248, 216, 186, 0.25); 
  opacity: 1.2; 
  position: relative; 
  padding: 65px 20px 20px; 
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  color: black;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const DisabledOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  display: ${({ disabled }) => (disabled ? "block" : "none")};
`;

const ControlButton = styled.button`
  background: #4caf50;
  border: none;
  color: white;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
`;

// Contenedor de Gráficas 
const ChartContainer = styled.div`
  background: white;
  padding: 15px;
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
`;

// Estado General
const StatusPanel = styled(Card)`
  background: rgba(123, 95, 61, 0.8);
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), 
              10px 10px 20px rgba(245, 239, 230, 0.2); 
  backdrop-filter: blur(10000px); 
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3)); 
  border: 1px solid rgba(248, 216, 186, 0.25); 
  opacity: 1.2; 
  position: relative; 
  padding: 20px;
  border-radius: 15px;
  position: relative;
  color: black;
  text-align: center;
  height: 100%;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: bold;
  background: ${({ color }) => color || "gray"};
  padding: 10px;
  border-radius: 10px;
  margin-top: 10px;
  color: white;
`;

// Rango de temperatura
const MIN_TEMP = 20; 
const MAX_TEMP = 100; 
const STEP = 5; 

// Contenedor del Slider
const SliderContainer = styled.div`
  width: 90%;
  height: 12px;
  background: #ccced0;
  border-radius: 1000px;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 20px;
`;

// Barra de Progreso del Slider
const ProgressBar = styled.div`
  height: 100%;
  background: #4caf50;
  border-radius: 1000px;
  width: ${({ value }) => ((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%;
  transition: width 0.3s ease-out;
`;

//  Círculo Deslizante
const SliderCircle = styled.div`
  width: 22px;
  height: 22px;
  background: white;
  border: 3px solid #4caf50;
  border-radius: 50%;
  position: absolute;
  left: ${({ value }) =>
    `calc(${((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}% - 11px)`};
  top: 50%;
  transform: translateY(-50%);
  transition: left 0.2s ease-out;
  cursor: grab;
`;

// Rayitas en el Slider
const MarkersContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
`;

const Marker = styled.div`
  width: 2px;
  height: ${({ isMajor }) => (isMajor ? "15px" : "10px")};
  background: ${({ active }) => (active ? "#4caf50" : "white")};
  opacity: 0.5;
  position: relative;

  &:hover::after {
    content: "${({ temp }) => temp}°C";
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.7);
    padding: 3px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }
`;

const CustomSlider = ({ value, onChange }) => {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = () => {
    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const rect = e.target.parentElement.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    let newValue =
      MIN_TEMP + Math.round(((percent / 100) * (MAX_TEMP - MIN_TEMP)) / STEP) * STEP;

    // Asegurar que el valor esté dentro del rango
    newValue = Math.max(MIN_TEMP, Math.min(MAX_TEMP, newValue));

    onChange(newValue);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <SliderContainer
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
    >
      <ProgressBar value={value} />
      <MarkersContainer>
        {Array.from({ length: (MAX_TEMP - MIN_TEMP) / STEP + 1 }, (_, i) => MIN_TEMP + i * STEP).map(
          (temp) => (
            <Marker key={temp} temp={temp} active={temp <= value} isMajor={temp % 10 === 0} />
          )
        )}
      </MarkersContainer>
      <SliderCircle value={value} />
    </SliderContainer>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [modoAutomatico, setModoAutomatico] = useState(false);
  const [placaTermica, setPlacaTermica] = useState(85);
  const [luzVisible, setLuzVisible] = useState(false);
  const [luzUV, setLuzUV] = useState(true);
  const [humidificador, setHumidificador] = useState(false);
  const [cicloDia, setCicloDia] = useState("mañana");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }

    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) setCicloDia("mañana");
    else if (hora >= 12 && hora < 18) setCicloDia("tarde");
    else setCicloDia("noche");
  }, [navigate]);

  // Datos de gráficas
  const chartData = (label, data, color) => ({
    labels: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
    datasets: [{ label, data, borderColor: color, backgroundColor: `${color}50` }],
  });

  return (
    <>
      <Header showUserIcon={true} />
      <Container>
        {/* Columna Izquierda */}
        <Column>
          <Card>
            <CardTitle>Temperatura</CardTitle>
            <MiniCard>
              <p>🌡️ Mínima: 22°C </p>
              <p>🌡️ Máxima: 32°C</p>
            </MiniCard>
          </Card>
          <Card>
            <CardTitle>Iluminación</CardTitle>
            <MiniCard>
              <p>☀️ Intensidad UV: 0.3</p>
            </MiniCard>
          </Card>
          <Card>
            <CardTitle>Humedad</CardTitle>
            <MiniCard>
              <p>💧 Humedad: 30%</p>
            </MiniCard>
          </Card>
        </Column>

        {/* Columna Central */}
        <CenterColumn>
          <ChartContainer>
            <Line data={chartData("Temperatura", [27, 28, 29, 30, 29, 28], "#FF9800")} />
          </ChartContainer>
          <ChartContainer>
            <Line data={chartData("Intensidad UV", [0.2, 0.3, 0.4, 0.3, 0.2, 0.1], "#FFC107")} />
          </ChartContainer>
          <ChartContainer>
            <Line data={chartData("Humedad %", [30, 35, 40, 38, 32, 30], "#2196F3")} />
          </ChartContainer>
        </CenterColumn>

       {/* Columna Derecha */}
       <RightColumn>
          <ControlPanel>
            <CardTitle>Panel de Control</CardTitle>
            <ButtonGroup>
              <ModeButton
                active={!modoAutomatico} 
                onClick={() => setModoAutomatico(false)} 
              >
                Modo Manual
              </ModeButton>
              <ModeButton
                active={modoAutomatico} 
                onClick={() => setModoAutomatico(true)} 
              >
                Modo Automático
              </ModeButton>
            </ButtonGroup>

            <MiniCard>
              <h3>💡 Luz Visible</h3>
              <CustomSwitch checked={luzVisible} onChange={setLuzVisible} />
            </MiniCard>

            <MiniCard>
              <h3>☀️ Luz UV</h3>
              <CustomSwitch checked={luzUV} onChange={setLuzUV} />
            </MiniCard>

            <ControlButton onClick={() => setHumidificador(!humidificador)} disabled={modoAutomatico}>
              ACTIVAR
            </ControlButton>
            <h4>🔥 Placa Térmica</h4>
            <CustomSlider value={placaTermica} onChange={setPlacaTermica} />
            <p>{Math.round(placaTermica)}%</p>
            <DisabledOverlay disabled={modoAutomatico} />
            
          </ControlPanel>

          <StatusPanel>
            <CardTitle>Estado General</CardTitle>
            <MiniCard>
              <p>🌞 Ciclo del Día: {cicloDia}</p>
            </MiniCard>
            <MiniCard>
              <StatusItem color="green">✅ Temperatura: Todo en orden</StatusItem>
            </MiniCard>
            <MiniCard>
              <StatusItem color="orange">⚠️ Iluminación: Necesita ajuste</StatusItem>
            </MiniCard>
            <MiniCard>
              <StatusItem color="red">❌ Humedad: Necesita atención</StatusItem>
            </MiniCard>
          </StatusPanel>
        </RightColumn>
      </Container>
      <Footer />
    </>
  );
};

export default Dashboard;