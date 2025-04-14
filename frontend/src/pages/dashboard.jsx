import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import advertencia from "../assets/alerta-amarillo.png";
import ok from "../assets/comprobado.png";
import peligro from "../assets/sirena.png";
import dia from "../assets/manana.png";
import noche from "../assets/noche.png";
import { LIMITES } from "../constants/Limites";


import {
  Container,
  CardTitle,
  ButtonGroup,
  ModeButton,
  SwitchContainer,
  SwitchWrapper,
  Slider,
  HiddenCheckbox,
  Card,
  MiniCard,
  Column,
  CenterColumn,
  RightColumn,
  ControlPanel,
  Overlay,
  Content,
  ControlButton,
  ChartContainer,
  StatusPanel,
  StatusItem,
  StatusImage,
  CycleImage,
  MIN_TEMP,
  MAX_TEMP,
  STEP,
  SliderContainer,
  ProgressBar,
  SliderCircle,
  MarkersContainer,
  Marker,
} from "../styles/dashboardStyles";

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

const socket = io("http://localhost:5000");

const CustomSwitch = ({ checked, onChange, disabled }) => {
  return (
    <SwitchContainer>
      <span>{checked ? "ON" : "OFF"}</span>
      <HiddenCheckbox
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
      />
      <SwitchWrapper checked={checked}>
        <Slider checked={checked} />
      </SwitchWrapper>
    </SwitchContainer>
  );
};

const CustomSlider = ({ value, onChange, disabled }) => {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = () => {
    if (!disabled) setDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || disabled) return;

    const rect = e.target.parentElement.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    let newValue =
      MIN_TEMP + Math.round(((percent / 100) * (MAX_TEMP - MIN_TEMP)) / STEP) * STEP;

    newValue = Math.max(MIN_TEMP, Math.min(MAX_TEMP, newValue));

    onChange(newValue);
  }, [dragging, onChange, disabled]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

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
  const [mudaPiel, setMudaPiel] = useState(false);
  const [cicloDia, setCicloDia] = useState("dia");

  const [temperaturaFria, setTemperaturaFria] = useState([]);
  const [temperaturaCaliente, setTemperaturaCaliente] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  
    const hora = new Date().getHours();
    setCicloDia(hora >= 6 && hora < 18 ? "dia" : "noche");
  
    fetch("http://localhost:5000/api/dashboard/1")
      .then((res) => res.json())
      .then((data) => {
        setTemperaturaFria(data.fria.reverse());
        setTemperaturaCaliente(data.caliente.reverse());
      });
  
    socket.on("sensor-data", (data) => {
      const valor = parseFloat(data.valor);
      if (isNaN(valor)) return;
  
      if (data.topic === "terrario/zonafria") {
        setTemperaturaFria((prev) => [...prev.slice(-19), valor]);
      }
  
      if (data.topic === "terrario/zonacaliente") {
        setTemperaturaCaliente((prev) => [...prev.slice(-19), valor]);
      }
    });
  
    return () => {
      socket.off("sensor-data");
    };
  }, [navigate]); 
  
      
  const cicloImagenes = { dia, noche };

  const chartData = (label, data, color) => {
    const timeLabels = data.map((_, i) => {
      const now = new Date();
      const ts = new Date(now.getTime() - (data.length - i - 1) * 10000); // cada 10s aprox.
      return ts.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Mexico_City",
      });
    });
  
    return {
      labels: timeLabels,
      datasets: [
        {
          label,
          data,
          borderColor: color,
          backgroundColor: `${color}50`,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    animation: false,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 20,
        max: 40,
        ticks: {
          stepSize: 0.2,
        },
        title: {
          display: true,
          text: "Temperatura (°C)",
          font: { size: 14 },
        },
      },
      x: {
        title: {
          display: true,
          text: "Hora ",
          font: { size: 14 },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };
  

  return (
    <>
      <Header showUserIcon={true} />
      <Container>
        <Column>
          <Card>
            <CardTitle>Temperatura</CardTitle>
            <MiniCard>
            <p>🌡️ Zona fría: {Number.isFinite(temperaturaFria.at(-1)) ? temperaturaFria.at(-1) : "--"}°C</p>
          <p>🔥 Zona caliente: {Number.isFinite(temperaturaCaliente.at(-1)) ? temperaturaCaliente.at(-1) : "--"}°C</p>

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

        <CenterColumn>
  <ChartContainer>
    <Line
      data={chartData("Zona Fría (°C)", temperaturaFria, "#2196F3")}
      options={chartOptions}
    />
  </ChartContainer>
  <ChartContainer>
    <Line
      data={chartData("Zona Caliente (°C)", temperaturaCaliente, "#FF5722")}
      options={chartOptions}
    />
  </ChartContainer>
  {/* Puedes comentar o quitar esta si aún no tienes humedad en tiempo real */}
  {/* <ChartContainer>
    <Line
      data={chartData("Humedad %", [30, 35, 40, 38, 32, 30], "#4CAF50")}
      options={chartOptions}
    />
  </ChartContainer> */}
</CenterColumn>


        <RightColumn>
          <ControlPanel>
            <CardTitle>Panel de Control</CardTitle>
            <ButtonGroup>
              <ModeButton
                active={!modoAutomatico}
                onClick={() => {
                  setModoAutomatico(false);
                  socket.emit("modo", "manual");
                }}
              >
                Modo Manual
              </ModeButton>
              <ModeButton
                active={modoAutomatico}
                onClick={() => {
                  setModoAutomatico(true);
                  socket.emit("modo", "automatico");
                }}
              >
                Modo Automático
              </ModeButton>
            </ButtonGroup>

            <Overlay active={modoAutomatico} />
            <Content>
              <h4>🔥 Placa Térmica</h4>
              <CustomSlider
                value={placaTermica}
                onChange={(temp) => {
                  setPlacaTermica(temp);
                  if (!modoAutomatico) {
                    socket.emit("placa-termica", { temperatura: temp });
                  }
                }}
                disabled={modoAutomatico}
              />
              <p>{placaTermica}°C</p>

              <div style={{ display: "flex", gap: "20px", width: "100%", justifyContent: "space-between" }}>
                <MiniCard style={{ flex: 1 }}>
                  <h3>Luz Visible</h3>
                  <CustomSwitch
                    checked={luzVisible}
                    onChange={(val) => {
                      setLuzVisible(val);
                      if (!modoAutomatico) {
                        socket.emit("luz-visible", { encendido: val });
                      }
                    }}
                    disabled={modoAutomatico}
                  />
                </MiniCard>
                <MiniCard style={{ flex: 1 }}>
                  <h3>Luz UV</h3>
                  <CustomSwitch
                    checked={luzUV}
                    onChange={(val) => {
                      setLuzUV(val);
                      if (!modoAutomatico) {
                        socket.emit("luz-uv", { encendido: val });
                      }
                    }}
                    disabled={modoAutomatico}
                  />
                </MiniCard>
              </div>

              <ControlButton
                onClick={() => {
                  const nuevo = !humidificador;
                  setHumidificador(nuevo);
                  if (!modoAutomatico) {
                    socket.emit("humidificador", { encendido: nuevo });
                  }
                }}
                disabled={modoAutomatico}
              >
                {humidificador ? "DESACTIVAR HUMIDIFICADOR" : "ACTIVAR HUMIDIFICADOR"}
              </ControlButton>

              <ControlButton
                onClick={() => {
                  const nuevo = !mudaPiel;
                  setMudaPiel(nuevo);
                  if (!modoAutomatico) {
                    socket.emit("muda-piel", { configuracion: nuevo ? "muda" : "normal" });
                  }
                }}
                disabled={modoAutomatico}
              >
                {mudaPiel ? "DESACTIVAR MUDA DE PIEL" : "ACTIVAR MUDA DE PIEL"}
              </ControlButton>
            </Content>
          </ControlPanel>

          <StatusPanel>
            <CardTitle>Estado General</CardTitle>
            <MiniCard>
              <p>Ciclo : {cicloDia}</p>
              <CycleImage src={cicloImagenes[cicloDia]} alt={`Ciclo ${cicloDia}`} />
            </MiniCard>
            <MiniCard>
              {(() => {
             const tf = temperaturaFria.at(-1);
             const tc = temperaturaCaliente.at(-1);
             
             if (!Number.isFinite(tf) || !Number.isFinite(tc)) return null;
             
             let color = "green";
             let msg = "Temperatura: Todo en orden";
             let icon = ok;
             
             const { bajo: bf, alto: af } = LIMITES.temperaturaFria;
             const { bajo: bc, alto: ac } = LIMITES.temperaturaCaliente;
             
             if (cicloDia === "dia") {
               if (tf < bf || tf > af || tc < bc || tc > ac) {
                 color = "red";
                 msg = "Temperatura: Necesita atención";
                 icon = peligro;
               } else if (
                 (tf >= bf && tf < (bf + 2)) || (tf > (af - 2) && tf <= af) ||
                 (tc >= bc && tc < (bc + 2)) || (tc > (ac - 2) && tc <= ac)
               ) {
                 color = "orange";
                 msg = "Temperatura: Necesita ajuste";
                 icon = advertencia;
               }
             
                } else {
                  if (tf < 18 || tf > 24 || tc < 24 || tc > 26) {
                    color = "red";
                    msg = "Temperatura: Necesita atención";
                    icon = peligro;
                  } else if (
                    (tf >= 18 && tf < 20) ||
                    (tf > 22 && tf <= 24)
                  ) {
                    color = "orange";
                    msg = "Temperatura: Necesita ajuste";
                    icon = advertencia;
                  }
                }

                return (
                  <StatusItem color={color}>
                    <span>{msg}</span>
                    <StatusImage src={icon} alt={msg} />
                  </StatusItem>
                );
              })()}
            </MiniCard>
            <MiniCard>
              <StatusItem color="orange">
                <span>Iluminación: Necesita ajuste</span>
                <StatusImage src={advertencia} alt="Luz baja" />
              </StatusItem>
            </MiniCard>
            <MiniCard>
              <StatusItem color="red">
                <span>Humedad: Necesita atención</span>
                <StatusImage src={peligro} alt="Humedad Baja" />
              </StatusItem>
            </MiniCard>
          </StatusPanel>
        </RightColumn>
      </Container>
      <Footer />
    </>
  );
};

export default Dashboard;
