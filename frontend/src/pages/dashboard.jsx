import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Container, CardTitle, ButtonGroup, ModeButton, SwitchContainer, SwitchWrapper, Slider, HiddenCheckbox, MiniCardLuz, CardLarge,
  Card, MiniCard, Column, SmallNote, GridInfo, ChartWithInfo, CenterColumn, RightColumn, ControlPanel, Overlay, Content, RightMiniCard, 
  RightCardTitle,ChartContainer, StatusPanel, ChartBlock, ChartTitle, StatusItem, StatusImage, CycleImage, MIN_TEMP, MAX_TEMP,
  STEP, InfoTitle, Item, InfoMiniCard, SliderContainer, ProgressBar, SliderCircle, MarkersContainer, Marker, HalfChartsRow
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
  const [temperaturaFria, setTemperaturaFria] = useState([]);
  const [temperaturaCaliente, setTemperaturaCaliente] = useState([]);
  const [humedad, setHumedad] = useState([]);
  const [luminosidad, setLuminosidad] = useState([]);
  const [uvi, setLuzUV] = useState(false);
  const [cicloDia, setCicloDia] = useState("dia");
  const [uviData, setUVIData] = useState([]);
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [placaTermica, setPlacaTermica] = useState(0);
  const [humidificador, setHumidificador] = useState(false);


  const navigate = useNavigate();
  const socket = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (!token || !userData?.ID_usuario) {
      navigate("/login");
      return;
    }

    socket.current = io("http://localhost:5000", {
      auth: { ID_usuario: userData.ID_usuario }
    });

    socket.current.on("sensor-data", (data) => {
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

    setCicloDia(new Date().getHours() >= 6 && new Date().getHours() < 18 ? "dia" : "noche");

    fetch(`http://localhost:5000/api/dashboard/${userData.ID_usuario}`)
      .then(res => res.json())
      .then(data => {
        setTemperaturaFria(data.fria.reverse());
        setTemperaturaCaliente(data.caliente.reverse());
      });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        console.log("🔴 WebSocket desconectado");
      }
    };
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
      animate={{
        opacity: on ? [0.5, 1, 0.5] : 0.3,
        scale: on ? [1, 1.05, 1] : 1,
        boxShadow: on
          ? "0px 0px 20px 8px rgba(156, 39, 176, 0.7)" // Glow morado
          : "none",
      }}
      transition={{
        duration: 2,
        repeat: on ? Infinity : 0,
        repeatType: "loop",
      }}
      style={{
        width: 35,
        height: 55,
        background: on ? "#9C27B0" : "#555",
        borderRadius: "50% 50% 35% 35%",
        margin: "auto",
        marginTop: 8,
      }}
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

        {/* Nueva Info de Temperatura aquí */}
        <InfoMiniCard>
          <InfoTitle>🌡️ Temperatura ({cicloDia === "dia" ? "Día" : "Noche"})</InfoTitle>
          <GridInfo>
            {cicloDia === "dia" ? (
              <>
                <Item><strong>Zona caliente:</strong> 30–35 °C</Item>
                <Item><strong>Zona fría:</strong> 26–28 °C</Item>
              </>
            ) : (
              <>
                <Item><strong>Zona caliente:</strong> 24–26 °C</Item>
                <Item><strong>Zona fría:</strong> 20–22 °C</Item>
              </>
            )}
          </GridInfo>
          <SmallNote>
            ✅ Mantener dentro del rango para bienestar del gecko.
          </SmallNote>
        </InfoMiniCard>
      </Card>

      <Card>
        <CardTitle>Iluminación</CardTitle>
        <MiniCardLuz>
          <p>☀️ Luminosidad: {luminosidad.at(-1) ?? "--"}</p>
          <p> Luz UV: {uvi ? "Encendida" : "Apagada"}</p>
        </MiniCardLuz>
      </Card>

      <CardLarge>
        <CardTitle>Humedad</CardTitle>
        <MiniCard>
          <p>💧 Humedad: {humedad.at(-1) ?? "--"}%</p>
        </MiniCard>

        {/* Nueva Info de Humedad aquí */}
        <InfoMiniCard>
          <InfoTitle>💧 Humedad</InfoTitle>
          <GridInfo>
            <Item><strong>Normal:</strong> 30% – 50%</Item>
            <Item><strong>Durante muda:</strong> 60% – 80%</Item>
          </GridInfo>
          <SmallNote>
            ✅ Mantener humedad adecuada para proteger la salud y el proceso de muda.
          </SmallNote>
        </InfoMiniCard>
      </CardLarge>
    </motion.div>
  </Column>

  <CenterColumn>

{/* Temperatura */}
<ChartWithInfo>
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
              borderColor: "rgb(33, 150, 243)",
              backgroundColor: "rgb(5, 82, 145)",
              tension: 0.3,
            },
            {
              label: "Zona Caliente (°C)",
              data: temperaturaCaliente.slice(-15),
              borderColor: "rgb(231, 0, 0)",
              backgroundColor: "rgb(116, 0, 0)",
              tension: 0.3,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: "Tiempo" } },
            y: { title: { display: true, text: "Temperatura (°C)" } },
          },
        }}
      />
    </ChartContainer>
  </ChartBlock>
</ChartWithInfo>

{/* Iluminación y UVI */}
<HalfChartsRow>

  {/* Iluminación */}
  <ChartWithInfo>
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
              borderColor: "rgb(238, 166, 10)",
              backgroundColor: "rgb(218, 84, 7)",
              tension: 0.3,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: "Tiempo" } },
              y: { title: { display: true, text: "Luminosidad (lux)" } },
            },
          }}
        />
      </ChartContainer>
    </ChartBlock>

    {/* Tarjeta de Iluminación (esta sí se queda) */}
    <InfoMiniCard>
      <InfoTitle>🌗 Iluminación ({cicloDia === "dia" ? "Día" : "Noche"})</InfoTitle>
      <div>
        {cicloDia === "dia" ? (
          <Item><strong>Día:</strong> Iluminación + UVB 6 horas</Item>
        ) : (
          <Item><strong>Noche:</strong> Ambos focos apagados</Item>
        )}
      </div>
      <SmallNote>✅ Respetar el ciclo natural para un desarrollo sano.</SmallNote>
    </InfoMiniCard>

  </ChartWithInfo>

  {/* UV */}
  <ChartWithInfo>
    <ChartBlock>
      <ChartTitle>UV</ChartTitle>
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
              tension: 0.3,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: "Tiempo" } },
              y: { title: { display: true, text: "UV" } },
            },
          }}
        />
      </ChartContainer>
    </ChartBlock>

    {/* Tarjeta de UV (esta sí se queda) */}
    <InfoMiniCard>
      <InfoTitle>🌞 Intensidad UV</InfoTitle>
      <div>
        <Item><strong>Valor ideal:</strong> 0.4 – 0.7</Item>
      </div>
      <SmallNote>⚠️ Evitar exposiciones prolongadas de UV.</SmallNote>
    </InfoMiniCard>

  </ChartWithInfo>

</HalfChartsRow>

{/* Humedad */}
<ChartWithInfo>
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
            borderColor: "rgb(11, 182, 54)",
            backgroundColor: "rgb(3, 90, 25)",
            tension: 0.3,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: "Tiempo" } },
            y: { title: { display: true, text: "Humedad (%)" } },
          },
        }}
      />
    </ChartContainer>
  </ChartBlock>
</ChartWithInfo>
</CenterColumn>

<RightColumn>
<ControlPanel>
  <RightCardTitle>Panel de Control</RightCardTitle>
  <ButtonGroup>
    <ModeButton
      active={!modoAutomatico}
      onClick={() => {
        setModoAutomatico(false);
        socket.current.emit("modo", "manual");
      }}
    >
      Modo Manual
    </ModeButton>
    <ModeButton
      active={modoAutomatico}
      onClick={() => {
        setModoAutomatico(true);
        socket.current.emit("modo", "automatico");
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
          socket.current.emit("placa-termica", { temperatura: temp });
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
            socket.current.emit("iluminacion", val);
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
            socket.current.emit("humidificador", { encendido: val });
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
        <span>UV: Encendido </span>
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
