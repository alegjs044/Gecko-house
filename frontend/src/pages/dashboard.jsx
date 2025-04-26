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
import { motion } from "framer-motion";
import {
  Container, CardTitle, ButtonGroup, ModeButton, SwitchContainer, SwitchWrapper, Slider, HiddenCheckbox,
  Card, MiniCard, Column, SmallNote, GridInfo, CenterColumn, RightColumn, ControlPanel, Overlay, Content, RightMiniCard, 
  RightCardTitle,ChartContainer, StatusPanel, ChartBlock, ChartTitle, StatusItem, StatusImage, CycleImage, MIN_TEMP, MAX_TEMP,
  STEP, InfoTitle, Item,SliderContainer, ProgressBar, SliderCircle, MarkersContainer, Marker, HalfChartsRow
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

const CustomSwitch = ({ checked, onChange, disabled }) => (
  <SwitchContainer>
    <span>{checked ? "ON" : "OFF"}</span>
    <HiddenCheckbox type="checkbox" checked={checked} onChange={() => onChange(!checked)} disabled={disabled} />
    <SwitchWrapper checked={checked}>
      <Slider checked={checked} />
    </SwitchWrapper>
  </SwitchContainer>
);

const CustomSlider = ({ value, onChange, disabled }) => {
  const [dragging, setDragging] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || disabled) return;
    const rect = e.target.parentElement.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    let newValue = MIN_TEMP + Math.round(((percent / 100) * (MAX_TEMP - MIN_TEMP)) / STEP) * STEP;
    newValue = Math.max(MIN_TEMP, Math.min(MAX_TEMP, newValue));
    onChange(newValue);
  }, [dragging, onChange, disabled]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <SliderContainer
      onMouseDown={() => !disabled && setDragging(true)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
    >
      <ProgressBar value={value} />
      <MarkersContainer>
        {Array.from({ length: (MAX_TEMP - MIN_TEMP) / STEP + 1 }, (_, i) => MIN_TEMP + i * STEP).map(temp => (
          <Marker key={temp} temp={temp} active={temp <= value} isMajor={temp % 10 === 0} />
        ))}
      </MarkersContainer>
      <SliderCircle value={value} />
    </SliderContainer>
  );
};


const Dashboard = () => {
  const navigate = useNavigate();
  const [modoAutomatico, setModoAutomatico] = useState(false);
  const [temperaturaFria, setTemperaturaFria] = useState([]);
  const [temperaturaCaliente, setTemperaturaCaliente] = useState([]);
  const [humedad, setHumedad] = useState([]);
  const [luminosidad, setLuminosidad] = useState([]);
  const [uvi, setLuzUV] = useState(false);
  const [humidificador, setHumidificador] = useState(false);
  const [placaTermica, setPlacaTermica] = useState(85);
  const [cicloDia, setCicloDia] = useState("dia");
  const [uviData, setUVIData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    setCicloDia(new Date().getHours() >= 6 && new Date().getHours() < 18 ? "dia" : "noche");

    fetch("http://localhost:5000/api/dashboard/1")
      .then(res => res.json())
      .then(data => {
        setTemperaturaFria(data.fria.reverse());
        setTemperaturaCaliente(data.caliente.reverse());
      });

    socket.on("sensor-data", (data) => {
      const valor = parseFloat(data.valor);
      if (isNaN(valor)) return;
      if (data.topic.includes("terrario/zonafria/User1")) setTemperaturaFria(prev => [...prev.slice(-19), valor]);
      if (data.topic.includes("terrario/zonacaliente/User1")) setTemperaturaCaliente(prev => [...prev.slice(-19), valor]);
      if (data.topic.includes("terrario/humedad/User1")) setHumedad(prev => [...prev.slice(-19), valor]);
      if (data.topic.includes("terrario/luminosidad/User1")) setLuminosidad(prev => [...prev.slice(-19), valor]);
      if (data.topic.includes("terrario/uvi/User1")) {
        if (!isNaN(valor)) {
          setLuzUV(true);
          setUVIData(prev => [...prev.slice(-19), valor]);
        } else {
          setLuzUV(false);
        }
      }
    });
    return () => socket.off("sensor-data");
  }, [navigate]);
  
      
  const cicloImagenes = { dia, noche };


  const evaluarParametro = (valor, { bajo, alto }) => {
    if (!Number.isFinite(valor)) return { color: "rgba(0,0,0,0.7)", mensaje: "Sin datos", icono: advertencia };
    if (valor < bajo || valor > alto) return { color: "red", mensaje: "Necesita atención", icono: peligro };
    if (valor < bajo + 4 || valor > alto - 4) return { color: "orange", mensaje: "Revisar condiciones", icono: advertencia };
    return { color: "green", mensaje: "Todo en orden", icono: ok };
  };

  const UVLight = ({ on }) => (
    <motion.div
      animate={{ opacity: on ? [0.4, 1, 0.4] : 0.2, scale: on ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 1.5, repeat: on ? Infinity : 0, repeatType: "loop" }}
      style={{ width: 30, height: 50, background: on ? "#9C27B0" : "#555", borderRadius: "50% 50% 35% 35%", margin: "auto", marginTop: 8, boxShadow: on ? "0px 0px 8px 3pxrgb(191, 46, 216)" : "none" }}
    />
  );

  return (
    <>
    <Header showUserIcon />
      <Container>
        <Column>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardTitle>Temperatura</CardTitle>
              <MiniCard>
                <p>🌡️ Zona Fría: {temperaturaFria.at(-1) ?? "--"}°C</p>
                <p>🔥 Zona Caliente: {temperaturaCaliente.at(-1) ?? "--"}°C</p>
              </MiniCard>
            </Card>

            <Card>
              <CardTitle>Iluminación</CardTitle>
              <MiniCard>
                <p>☀️ Luminosidad: {luminosidad.at(-1) ?? "--"}</p>
                <p>🌞 Luz UV: {uvi ? "Encendida" : "Apagada"}</p>
              </MiniCard>
            </Card>

            <Card>
              <CardTitle>Humedad</CardTitle>
              <MiniCard>
                <p>💧 Humedad: {humedad.at(-1) ?? "--"}%</p>
              </MiniCard>
            </Card>
          </motion.div>
        </Column>

        <CenterColumn>

{/* Temperatura */}
<ChartBlock style={{ height: '280px' }}>
  <ChartTitle>Temperatura</ChartTitle>
  <ChartContainer>
    <Line
      data={{
        labels: temperaturaFria.slice(-15).map((_, i) => {
          const now = new Date();
          const ts = new Date(now.getTime() - (temperaturaFria.slice(-15).length - i - 1) * 10000);
          return ts.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Mexico_City",
          });
        }),
        datasets: [
          {
            label: "Zona Fría (°C)",
            data: temperaturaFria.slice(-15),
            borderColor: "#2196F3",
            backgroundColor: "#2196F350",
            tension: 0.3,
          },
          {
            label: "Zona Caliente (°C)",
            data: temperaturaCaliente.slice(-15),
            borderColor: "#FF5722",
            backgroundColor: "#FF572250",
            tension: 0.3,
          }
        ]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Tiempo" } },
          y: { title: { display: true, text: "Temperatura (°C)" } }
        }
      }}
    />
  </ChartContainer>
  <MiniCard>
  <InfoTitle>🌡️ Temperatura</InfoTitle>
  <GridInfo>
    <Item><strong>Fría (noche):</strong> 20–22 °C</Item>
    <Item><strong>Fría (día):</strong> 22–32 °C</Item>
    <Item><strong>Caliente:</strong> 24–36 °C</Item>
  </GridInfo>
  <SmallNote>⚠️ Evitar temperaturas fuera de rango.</SmallNote>
</MiniCard>
</ChartBlock>

{/* Iluminación y UVI */}
<HalfChartsRow>

  {/* Iluminación */}
  <ChartBlock>
    <ChartTitle>Iluminación</ChartTitle>
    <ChartContainer>
      <Line
        data={{
          labels: luminosidad.slice(-7).map((_, i) => {
            const now = new Date();
            const ts = new Date(now.getTime() - (luminosidad.slice(-7).length - i - 1) * 10000);
            return ts.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "America/Mexico_City",
            });
          }),
          datasets: [{
            label: "Luminosidad (lux)",
            data: luminosidad.slice(-7),
            backgroundColor: "yellow",
            tension: 0.3
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: "Tiempo" } },
            y: { title: { display: true, text: "Luminosidad (lux)" } }
          }
        }}
      />
    </ChartContainer>
    <MiniCard>Iluminación actual</MiniCard>
  </ChartBlock>

  {/* UVI */}
  <ChartBlock>
    <ChartTitle>UVI</ChartTitle>
    <ChartContainer>
      <Line
        data={{
          labels: uviData.slice(-7).map((_, i) => {
            const now = new Date();
            const ts = new Date(now.getTime() - (uviData.slice(-7).length - i - 1) * 10000);
            return ts.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "America/Mexico_City",
            });
          }),
          datasets: [{
            label: "UV",
            data: uviData.slice(-7),
            borderColor: "#9C27B0",
            backgroundColor: "#9C27B050",
            tension: 0.3
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: "Tiempo" } },
            y: { title: { display: true, text: "UV" } }
          }
        }}
      />
    </ChartContainer>
    <MiniCard>UVI actual</MiniCard>
  </ChartBlock>

</HalfChartsRow>

{/* Humedad */}
<ChartBlock>
  <ChartTitle>Humedad</ChartTitle>
  <ChartContainer>
    <Line
      data={{
        labels: humedad.slice(-10).map((_, i) => {
          const now = new Date();
          const ts = new Date(now.getTime() - (humedad.slice(-10).length - i - 1) * 10000);
          return ts.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Mexico_City",
          });
        }),
        datasets: [{
          label: "Humedad (%)",
          data: humedad.slice(-10),
          borderColor: "#4CAF50",
          backgroundColor: "#4CAF5050",
          tension: 0.3
        }]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Tiempo" } },
          y: { title: { display: true, text: "Humedad (%)" } }
        }
      }}
    />
  </ChartContainer>
  <MiniCard>Humedad actual</MiniCard>
</ChartBlock>

</CenterColumn>


<RightColumn>
<ControlPanel>
  <RightCardTitle>Panel de Control</RightCardTitle>

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

  <Content data-disabled={modoAutomatico}>
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
      style={{
        background: modoAutomatico ? "#222" : "#ccced0",
        borderRadius: "1000px",
        width: "100%",
        margin: "30px auto 20px",
      }}
    />
    <p>{placaTermica} Potencia (%)</p>

    <RightMiniCard
      style={{
        background: modoAutomatico ? "#222" : "#f7d9b3",
        marginTop: "20px",
        color: modoAutomatico ? "white" : "black",
      }}
    >
      <h4 style={{ color: modoAutomatico ? "white" : "#093609" }}>Luz UV</h4>
      <CustomSwitch
        checked={uvi}
        onChange={(val) => {
          setLuzUV(val);
          if (!modoAutomatico) {
            socket.emit("iluminacion", val);
          }
        }}
        disabled={modoAutomatico}
      />
    </RightMiniCard>

    <RightMiniCard
      style={{
        background: modoAutomatico ? "#222" : "#f7d9b3",
        marginTop: "20px",
        color: modoAutomatico ? "white" : "black",
      }}
    >
      <h4 style={{ color: modoAutomatico ? "white" : "#093609" }}>Humidificador</h4>
      <CustomSwitch
        checked={humidificador}
        onChange={(val) => {
          setHumidificador(val);
          if (!modoAutomatico) {
            socket.emit("humidificador", { encendido: val });
          }
        }}
        disabled={modoAutomatico}
      />
    </RightMiniCard>
  </Content>
</ControlPanel>


  <StatusPanel style={{ marginTop: "30px", minHeight: "550px" }}>
  <RightCardTitle>Estado General</RightCardTitle>

  <RightMiniCard>
    <p>Ciclo: {cicloDia}</p>
    <CycleImage src={cicloImagenes[cicloDia]} alt={`Ciclo ${cicloDia}`} />
  </RightMiniCard>

  <RightMiniCard>
    {(() => {
      const tf = temperaturaFria.at(-1);
      const tc = temperaturaCaliente.at(-1);

      if (!Number.isFinite(tf) || !Number.isFinite(tc)) {
        return (
          <StatusItem color="rgba(0,0,0,0.7)">
            <span>Temperatura: Sin datos</span>
            <StatusImage src={advertencia} alt="Sin datos" />
          </StatusItem>
        );
      }

      const frio = evaluarParametro(tf, LIMITES.temperaturaFria);
      const caliente = evaluarParametro(tc, LIMITES.temperaturaCaliente);

      let final = frio.color === "red" || caliente.color === "red"
        ? { color: "red", mensaje: "Temperatura: Necesita atención", icono: peligro }
        : frio.color === "orange" || caliente.color === "orange"
        ? { color: "orange", mensaje: "Temperatura: Revisar condiciones", icono: advertencia }
        : { color: "green", mensaje: "Temperatura: Todo en orden", icono: ok };

      return (
        <StatusItem color={final.color}>
          <span>{final.mensaje}</span>
          <StatusImage src={final.icono} alt={final.mensaje} />
        </StatusItem>
      );
    })()}
  </RightMiniCard>

  <RightMiniCard>
    {(() => {
      const humedadActual = humedad.at(-1);

      if (!Number.isFinite(humedadActual)) {
        return (
          <StatusItem color="rgba(0,0,0,0.7)">
            <span>Humedad: Sin datos</span>
            <StatusImage src={advertencia} alt="Sin datos" />
          </StatusItem>
        );
      }

      const estadoHumedad = evaluarParametro(humedadActual, LIMITES.humedad);

      let msg = estadoHumedad.color === "red"
        ? "Humedad: Necesita atención"
        : estadoHumedad.color === "orange"
        ? "Humedad: Revisar condiciones"
        : "Humedad: Todo en orden";

      return (
        <StatusItem color={estadoHumedad.color}>
          <span>{msg}</span>
          <StatusImage src={estadoHumedad.icono} alt={msg} />
        </StatusItem>
      );
    })()}
  </RightMiniCard>



  <RightMiniCard>
    {uvi ? (
      <StatusItem color="#9C27B0">
        <span>UV: Encendido ({uvi.at(-1)})</span>
        <UVLight on />
      </StatusItem>
    ) : (
      <StatusItem color="rgba(0,0,0,0.7)">
        <span>UV: Apagado</span>
        <UVLight on={false} />
      </StatusItem>
    )}
  </RightMiniCard>
</StatusPanel>

</RightColumn>



</Container>
      <Footer />
    </>
  );
};

export default Dashboard;
