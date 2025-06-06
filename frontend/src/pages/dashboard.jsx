import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {  AnimatePresence , motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import advertencia from "../assets/alerta-amarillo.png";
import ok from "../assets/comprobado.png";
import peligro from "../assets/sirena.png";
import dia from "../assets/manana.png";
import noche from "../assets/noche.png";
import { LIMITES } from "../constants/Limites";
import { Line } from "react-chartjs-2";

import {
  MainContainer,LeftSection,TopCards,StatusCard,StatusTitle,StatusValue, DataDisplayCard, DataDisplayTitle,
  DataRow, DataLabel, DataValue, StatusIcon, PageContainer, ChartWithMonitorRow,ConnectionInfo,
  CycleIcon,RightSection,ControlPanel,ModeButtons, ToastContainer,ToastMessage,ToastTitle,ToastSubtitle,
  ControlSection,ControlLabel,NumericControl,ControlTitle,NumericButton,NumericInput,ControlButton,PowerDisplay,
  ChartCard,ChartTitle,ChartContainer,ModeButton,ControlsGrid
} from "../styles/dashboardStyles";

import {
  Chart as ChartJS,
  CategoryScale, 
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale, 
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const evaluarParametro = (valor, limites, esTemperatura = false, zona = null) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return { 
      estado: 'sin-datos', 
      color: '#6c757d', 
      icono: '❓',
      mensaje: 'Sin datos'
    };
  }

  // Para temperatura, verificar que tengamos límites específicos de zona
  if (esTemperatura && zona && limites[zona]) {
    const { min, max } = limites[zona];
    
    if (valor < min) {
      return {
        estado: 'bajo',
        color: 'orange',
        icono: '🥶',
        mensaje: `Muy bajo (${valor}°C < ${min}°C)`
      };
    } else if (valor > max) {
      return {
        estado: 'alto',
        color: 'red',
        icono: '🔥',
        mensaje: `Muy alto (${valor}°C > ${max}°C)`
      };
    } else {
      return {
        estado: 'normal',
        color: 'green',
        icono: '✅',
        mensaje: `Normal (${min}°C - ${max}°C)`
      };
    }
  }
  if (limites && typeof limites === 'object') {
    let min, max;
    
    if (limites.min !== undefined && limites.max !== undefined) {
      min = limites.min;
      max = limites.max;
    } else if (limites.bajo !== undefined && limites.alto !== undefined) {
      min = limites.bajo;
      max = limites.alto;
    } else {
      return {
        estado: 'sin-limites',
        color: '#6c757d',
        icono: '⚙️',
        mensaje: 'Sin límites configurados'
      };
    }
    
    if (valor < min) {
      return {
        estado: 'bajo',
        color: 'orange',
        icono: '⬇️',
        mensaje: `Bajo (${valor} < ${min})`
      };
    } else if (valor > max) {
      return {
        estado: 'alto',
        color: 'red',
        icono: '⬆️',
        mensaje: `Alto (${valor} > ${max})`
      };
    } else {
      return {
        estado: 'normal',
        color: 'green',
        icono: '✅',
        mensaje: `Normal (${min} - ${max})`
      };
    }
  }

  return {
    estado: 'sin-limites',
    color: '#6c757d',
    icono: '⚙️',
    mensaje: 'Sin límites configurados'
  };
};

const showModeToast = (isAutomatic, setShowToast, setToastMessage) => {
  const message = isAutomatic 
    ? {
        isAuto: true,
        title: " Modo Automático Activado",
        subtitle: "El sistema controlará automáticamente todos los parámetros"
      }
    : {
        isAuto: false,
        title: "Modo Manual Activado", 
        subtitle: "Ahora puedes controlar manualmente todos los dispositivos"
      };
  
  setToastMessage(message);
  setShowToast(true);
  
  setTimeout(() => {
    setShowToast(false);
  }, 4000);
};
const getIconFromMessage = (msg) => msg.match(/^[^\s]+/)?.[0] || "ℹ️";


const mensajesInfo = [
  "💧 Humedad Normal:\n30–50%",
  "💧 Humedad en Muda:\n50–70%",
  "🌡️ Zona Caliente Día:\n28–34°C",
  "🌡️ Zona Caliente Noche:\n25–28°C",
  "❄️ Zona Fría Día:\n26–28°C",
  "❄️ Zona Fría Noche:\n20–24°C",
  "🌗 Ciclo Normal:\n10–12 horas de luz",
  "🌞 Ciclo Verano:\n12–14 horas de luz",
  "🔆 UV Ideal:\n0.2–1 UV por 2 horas"
];

const getInfoBgColor = (mensaje) => {
  if (mensaje.includes("💧")) return "linear-gradient(135deg, #2196f3, #03a9f4)";
  if (mensaje.includes("🌡️")) return "linear-gradient(135deg, #ef5350,rgba(48, 100, 177, 0.9))";
  if (mensaje.includes("❄️")) return "linear-gradient(135deg,rgb(230, 236, 241),rgb(11, 83, 116))";
  if (mensaje.includes("🌗") || mensaje.includes("🌞")) return "linear-gradient(135deg, #ff9800, #fb8c00)";
  if (mensaje.includes("🔆")) return "linear-gradient(135deg, #ab47bc, #8e24aa)";
  return "linear-gradient(135deg, #607d8b, #90a4ae)"; // Default
};


const Dashboard = () => {
  const [temperaturaFria, setTemperaturaFria] = useState([]);
  const [temperaturaCaliente, setTemperaturaCaliente] = useState([]);
  const [humedad, setHumedad] = useState([]);
  const [luminosidad, setLuminosidad] = useState([]);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [uviData, setUVIData] = useState([]);
  const [uvi, setLuzUV] = useState(false);
  const [cicloDia, setCicloDia] = useState("dia");
  const [bloqueoFoco, setBloqueoFoco] = useState(false);
  const [bloqueoUV, setBloqueoUV] = useState(false);
  const [bloqueoHumidificador, setBloqueoHumidificador] = useState(false);
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [placaTermica, setPlacaTermica] = useState(0);
  const [humidificador, setHumidificador] = useState(false);
  const [controlUV, setControlUV] = useState(false);
  const [controlFoco, setControlFoco] = useState(false);
  const [enMuda, setEnMuda] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ isAuto: true, title: "", subtitle: "" });
  const [socketConnected, setSocketConnected] = useState(false);
  const [mensajeActual, setMensajeActual] = useState(mensajesInfo[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMensajeActual(prev => {
        const index = mensajesInfo.indexOf(prev);
        return mensajesInfo[(index + 1) % mensajesInfo.length];
      });
    }, 6000); // cambia cada 6 segundos
    return () => clearInterval(interval);
  }, []);

  const [startTime] = useState(() => {
    const saved = localStorage.getItem('sessionStartTime');
    return saved ? parseInt(saved) : Date.now();
  });
  const [elapsedTime, setElapsedTime] = useState("0s");

  const navigate = useNavigate();
  const socket = useRef(null);

  // contador de tiempo
  useEffect(() => {
    localStorage.setItem('sessionStartTime', startTime.toString());
    
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds}s`);
      } else {
        setElapsedTime(`${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  // Al cargar el componente:
  useEffect(() => {
    const savedMode = localStorage.getItem("modoGecko");
    if (savedMode === "manual") {
      setModoAutomatico(false);
    } else {
      setModoAutomatico(true); // default automático
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userDataStr = localStorage.getItem("userData");
    
    let userData;
    try {
      userData = userDataStr ? JSON.parse(userDataStr) : null;
    } catch (error) {
      console.error('❌ Error parseando userData:', error);
      navigate("/login");
      return;
    }

    if (!token || !userData?.ID_usuario) {
      console.error('❌ Autenticación incompleta');
      navigate("/login");
      return;
    }

    const ID_usuario = parseInt(userData.ID_usuario);
    if (isNaN(ID_usuario) || ID_usuario <= 0) {
      console.error('❌ ID_usuario inválido:', userData.ID_usuario);
      navigate("/login");
      return;
    }

    console.log('✅usuario:', ID_usuario);

    setModoAutomatico(true);
    setControlFoco(false);
    setControlUV(false);
    setHumidificador(false);
    setPlacaTermica(0);

    socket.current = io("http://localhost:5000", { 
      auth: { 
        ID_usuario: ID_usuario,
        token: token
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      timeout: 20000,
      autoConnect: true
    });

    socket.current.on("connect", () => {
      setSocketConnected(true);
      
      socket.current.emit('user-identification', {
        ID_usuario: ID_usuario,
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      });
    });

    socket.current.on("connect_error", (error) => {
      console.error('❌ Error de conexión:', error.message);
      setSocketConnected(false);
    });

    socket.current.on("disconnect", (reason) => {
      console.log('🔴 Socket desconectado:', reason);
      setSocketConnected(false);
    });

    socket.current.on("user-confirmed", (data) => {
    });

    socket.current.on("sensor-data", (data) => {
      if (data.zona === "muda") {
        const enMudaValue = data.valor === 1 || data.valor === true;
        console.log('🦎 Estado de muda:', enMudaValue);
        setEnMuda(enMudaValue);
        return;
      }
      
      if (data.zona === "ciclo") {
        const ciclo = typeof data.valor === 'string' ? data.valor.toLowerCase() : data.valor;
        console.log('🌅 Ciclo actualizado:', ciclo);
        setCicloDia(ciclo);
        return;
      }
      
      const valor = parseFloat(data.valor);
      if (isNaN(valor)) {
        return;
      }
      
      if (data.zona === "temperatura" || 
          data.topic.includes("zonafria") || 
          data.topic.includes("fria") ||
          data.topic.includes("zonacaliente") || 
          data.topic.includes("caliente")) {
        
        let zona = null;
        if (data.topic.includes("zonafria") || data.topic.includes("fria")) {
          zona = "fria";
        } else if (data.topic.includes("zonacaliente") || data.topic.includes("caliente")) {
          zona = "caliente";
        }
        
        if (zona === "fria") {
          console.log('❄️ Temperatura fría:', valor);
          setTemperaturaFria(prev => [...prev.slice(-49), valor]);
        } else if (zona === "caliente") {
          console.log('🔥 Temperatura caliente:', valor);
          setTemperaturaCaliente(prev => [...prev.slice(-49), valor]);
        }
        return;
      }
      
      if (data.zona === "humedad" || data.topic.includes("humedad")) {
        console.log('💧 Humedad:', valor);
        setHumedad(prev => [...prev.slice(-49), valor]);
      } else if (data.zona === "luminosidad" || data.topic.includes("luminosidad")) {
        console.log('☀️ Luminosidad:', valor);
        setLuminosidad(prev => [...prev.slice(-49), valor]);
      } else if (data.zona === "luz_uv" || data.topic.includes("uvi")) {
        console.log('🔆 UV recibido:', valor);
        setLuzUV(valor > 0);
        setUVIData(prev => [...prev.slice(-49), valor]);
      }
    });

socket.current.on("actuador-data", (data) => {
  const { zona, valor } = data;
  const numeric = typeof valor === "string" ? parseInt(valor) : valor;

  switch (zona) {
    case "placaP":
    case "placa":
      setPlacaTermica(numeric);
      break;
    case "humidificadorP":
    case "humidificador":
      setHumidificador(numeric === 1);
      break;
    case "focoP":
    case "foco":
      setControlFoco(numeric === 1);
      break;
    case "focouviP":
    case "focouvi":
    case "uv":
      setControlUV(numeric === 1);
      break;
    case "modo":
  const isAuto = numeric === 1;
  setModoAutomatico(isAuto);
  localStorage.setItem("modoGecko", isAuto ? "auto" : "manual");
  showModeToast(isAuto, setShowToast, setToastMessage);
  break;
    default:
      break;
  }
});

    // CARGAR DATOS INICIALES
    fetch(`http://localhost:5000/api/historial/temperatura?ID_usuario=${ID_usuario}`)
      .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
      .then(data => {
        if (data.length > 0) {
          const fria = data.filter(d => d.zona === 'fria' || d.zona === 'fría').map(d => d.medicion);
          const caliente = data.filter(d => d.zona === 'caliente').map(d => d.medicion);
          
          setTemperaturaFria(fria.slice(-50));
          setTemperaturaCaliente(caliente.slice(-50));
        }
      })
      .catch(error => {
        console.error("❌ Error cargando datos de temperatura:", error);
      });

    // CARGAR HUMEDAD
    fetch(`http://localhost:5000/api/historial/humedad?ID_usuario=${ID_usuario}`)
      .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
      .then(data => {
        if (data.length > 0) {
          const humedadValues = data.map(d => d.medicion);
          setHumedad(humedadValues.slice(-50));
        }
      })
      .catch(error => {
        console.error("❌ Error cargando datos de humedad:", error);
      });

    // CLEANUP
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
      setSocketConnected(false);
    };
  }, [navigate]);

  const handlePlacaChange = (newValue) => {
    const val = Math.max(0, Math.min(100, newValue));
    setPlacaTermica(val);
    if (!modoAutomatico && socket.current?.connected) {
      console.log(`🔥 Enviando comando placa térmica: ${val}%`);
      socket.current.emit("placa-termica", { temperatura: val });
    }
  };

  const handleControlToggle = (type) => {
    if (modoAutomatico) {
      console.log('⚠️ Modo automático activo, comando ignorado');
      return;
    }
    
    if (!socket.current?.connected) {
      console.error('❌ Socket no conectado, no se puede enviar comando');
      return;
    }
    
    switch (type) {
      case 'uv':
        if (bloqueoUV) return;
        setBloqueoUV(true);
        const estadoUV = !controlUV;
        console.log(`🔆 Enviando comando UV: ${estadoUV ? 'ON' : 'OFF'}`);
        
        socket.current.emit("control-uv", { encendido: estadoUV });
        
        setTimeout(() => {
          setControlUV(estadoUV);
          setBloqueoUV(false);
        }, 1000);
        break;
        
      case 'foco':
        if (bloqueoFoco) return;
        setBloqueoFoco(true);
        const estadoFoco = !controlFoco;
        console.log(`💡 Enviando comando foco: ${estadoFoco ? 'ON' : 'OFF'}`);
        
        socket.current.emit("control-foco", { encendido: estadoFoco });
        
        setTimeout(() => {
          setControlFoco(estadoFoco);
          setBloqueoFoco(false);
        }, 1000);
        break;
        
      case 'humidificador':
        if (bloqueoHumidificador) return;
        setBloqueoHumidificador(true);
        const estadoHum = !humidificador;
        console.log(`💧 Enviando comando humidificador: ${estadoHum ? 'ON' : 'OFF'}`);
        
        socket.current.emit("control-humidificador", { encendido: estadoHum });
        
        setTimeout(() => {
          setHumidificador(estadoHum);
          setBloqueoHumidificador(false);
        }, 1000);
        break;
        
      default:
        console.warn(`Tipo de control no reconocido: ${type}`);
        break;
    }
  };

  // Al cambiar de modo:
  const handleModeChange = (isAutomatic) => {
    setModoAutomatico(isAutomatic);
    localStorage.setItem("modoGecko", isAutomatic ? "auto" : "manual");
    
    if (socket.current?.connected) {
      const mode = isAutomatic ? "automatico" : "manual";
      console.log(`🔄 Cambiando modo a: ${mode.toUpperCase()}`);
      socket.current.emit("modo", mode);
    }
    
    showModeToast(isAutomatic, setShowToast, setToastMessage);
  };

  const evaluarEstadoTemperatura = () => {
    const tf = temperaturaFria.at(-1);
    const tc = temperaturaCaliente.at(-1);
    
    if (!Number.isFinite(tf) || !Number.isFinite(tc)) {
      return 'sinDatos';
    }
    
    const frioEval = evaluarParametro(tf, LIMITES.temperaturaFria);
    const calienteEval = evaluarParametro(tc, LIMITES.temperaturaCaliente);
    
    if (frioEval.estado === "critico" || calienteEval.estado === "critico") {
      return 'critico';
    } else if (frioEval.estado === "revisar" || calienteEval.estado === "revisar") {
      return 'revisar';
    } else {
      return 'ideal';
    }
  };

  const evaluarEstadoHumedad = () => {
    const humedadActual = humedad.at(-1);
    
    if (!Number.isFinite(humedadActual)) {
      return 'sinDatos';
    }
    
    const limitesHumedad = LIMITES.humedad?.[enMuda ? "muda" : "normal"];
    const humedadEval = evaluarParametro(humedadActual, limitesHumedad);
    
    return humedadEval.estado;
  };
  return (
    <PageContainer>
      <Header showUserIcon />
        {/* Tarjetas de Estado Superior */}
        <TopCards>
          {/* Ciclo */}
          <StatusCard
            bgColor="linear-gradient(135deg, #f57c00 0%, #ff9800 100%)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatusTitle>Ciclo</StatusTitle>
            <StatusValue>
              {cicloDia === "dia" ? "DÍA" : 
               cicloDia === "noche" ? "NOCHE" : 
               cicloDia === "diaam" ? "AMANECER" : 
               cicloDia.toUpperCase()}
              <CycleIcon src={cicloDia === "dia" ? dia : noche} alt={cicloDia} />
            </StatusValue>
          </StatusCard>

          {/* Estado Temperatura */}
          <StatusCard
            bgColor={(() => {
              const tf = temperaturaFria.at(-1);
              const tc = temperaturaCaliente.at(-1);
              
              if (!Number.isFinite(tf) || !Number.isFinite(tc)) {
                return "linear-gradient(135deg, #757575 0%, #9e9e9e 100%)";
              }
              
              const frioEval = evaluarParametro(tf, LIMITES.temperaturaFria);
              const calienteEval = evaluarParametro(tc, LIMITES.temperaturaCaliente);
              
              if (frioEval.color === "red" || calienteEval.color === "red") {
                return "linear-gradient(135deg,rgba(211, 47, 47, 0.65) 0%, #f44336 100%)";
              } else if (frioEval.color === "orange" || calienteEval.color === "orange") {
                return "linear-gradient(135deg,rgba(245, 123, 0, 0.66) 0%,rgba(255, 153, 0, 0.62) 100%)";
              } else {
                return "linear-gradient(135deg,rgba(46, 125, 50, 0.62) 0%,rgba(76, 175, 79, 0.62) 100%)";
              }
            })()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatusTitle>Temperatura</StatusTitle>
<StatusValue>
  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
    Fría: {temperaturaFria.at(-1)?.toFixed(1) ?? "--"}°C | Caliente: {temperaturaCaliente.at(-1)?.toFixed(1) ?? "--"}°C
  </div>
  <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap", textAlign: "center" }}>
    {(() => {
      const tf = temperaturaFria.at(-1);
      const tc = temperaturaCaliente.at(-1);

      if (!Number.isFinite(tf) || !Number.isFinite(tc)) {
        return (
          <>
            SIN DATOS
            <StatusIcon src={advertencia} alt="Sin datos" />
          </>
        );
      }

      const frioEval = evaluarParametro(tf, LIMITES.temperaturaFria);
      const calienteEval = evaluarParametro(tc, LIMITES.temperaturaCaliente);

      if (frioEval.color === "red" || calienteEval.color === "red") {
        return (
          <>
            ESTADO CRÍTICO
            <StatusIcon src={peligro} alt="Crítico" />
          </>
        );
      } else if (frioEval.color === "orange" || calienteEval.color === "orange") {
        return (
          <>
            REVISAR TERRARIO
            <StatusIcon src={advertencia} alt="Revisar" />
          </>
        );
      } else {
        return (
          <>
            ESTADO IDEAL
            <StatusIcon src={ok} alt="Óptimo" />
          </>
        );
      }
    })()}
  </div>
</StatusValue>

          </StatusCard>

          {/* Estado Humedad */}
          <StatusCard
            bgColor={(() => {
              const humedadActual = humedad.at(-1);
              
              if (!Number.isFinite(humedadActual)) {
                return "linear-gradient(135deg,rgba(117, 117, 117, 0.61) 0%,rgba(158, 158, 158, 0.62) 100%)";
              }
              
              const limitesHumedad = LIMITES.humedad?.[enMuda ? "muda" : "normal"];
              const humedadEval = evaluarParametro(humedadActual, limitesHumedad);
              
              if (humedadEval.color === "red") {
                return "linear-gradient(135deg,rgba(211, 47, 47, 0.61) 0%,rgba(244, 67, 54, 0.61) 100%)";
              } else if (humedadEval.color === "orange") {
                return "linear-gradient(135deg,rgba(245, 123, 0, 0.63) 0%,rgba(255, 153, 0, 0.62) 100%)";
              } else {
                return "linear-gradient(135deg,rgba(0, 187, 212, 0.63) 0%,rgba(77, 208, 225, 0.6) 100%)";
              }
            })()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatusTitle>Humedad</StatusTitle>
            <StatusValue>
  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
    Actual: {humedad.at(-1) ? `${Math.round(humedad.at(-1))}%` : '--'}
  </div>
  <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap", textAlign: "center" }}>
    {(() => {
      const humedadActual = humedad.at(-1);

      if (!Number.isFinite(humedadActual)) {
        return (
          <>
            SIN DATOS
            <StatusIcon src={advertencia} alt="Sin datos" />
          </>
        );
      }

      const limitesHumedad = LIMITES.humedad?.[enMuda ? "muda" : "normal"];
      const humedadEval = evaluarParametro(humedadActual, limitesHumedad);

      if (humedadEval.color === "red") {
        return (
          <>
            ESTADO CRÍTICO
            <StatusIcon src={peligro} alt="Crítico" />
          </>
        );
      } else if (humedadEval.color === "orange") {
        return (
          <>
            REVISAR HUMEDAD
            <StatusIcon src={advertencia} alt="Revisar" />
          </>
        );
      } else {
        return (
          <>
            ESTADO IDEAL
            <StatusIcon src={ok} alt="Óptimo" />
          </>
        );
      }
    })()}
  </div>
</StatusValue>

          </StatusCard>
<StatusCard
  bgColor={getInfoBgColor(mensajeActual)}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
>
  <StatusTitle>Lo recomendado:</StatusTitle>
  <StatusValue style={{ whiteSpace: 'pre-line' }}>
    <motion.span
      key={getIconFromMessage(mensajeActual)}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ fontSize: 20 }}
    >
      {getIconFromMessage(mensajeActual)}
    </motion.span>

    <AnimatePresence mode="wait">
      <motion.div
        key={mensajeActual}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.5 }}
      >
        {mensajeActual.replace(getIconFromMessage(mensajeActual), "").trim()}
      </motion.div>
    </AnimatePresence>
  </StatusValue>
</StatusCard>
</TopCards>
<MainContainer>
  <LeftSection>
        {/* Gráfica de Temperatura */}
<ChartWithMonitorRow>
  <ChartCard>
    <ChartTitle>🌡️ Temperatura ({temperaturaFria.length + temperaturaCaliente.length} registros)</ChartTitle>
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
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              tension: 0,
              pointRadius: 4,
              pointBackgroundColor: "rgb(33, 150, 243)",
            },
            {
              label: "Zona Caliente (°C)",
              data: temperaturaCaliente.slice(-15),
              borderColor: "rgb(231, 76, 60)",
              backgroundColor: "rgba(231, 76, 60, 0.1)",
              tension: 0,
              pointRadius: 4,
              pointBackgroundColor: "rgb(231, 76, 60)",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            x: {
              title: { display: true, text: "Tiempo" },
              grid: { color: "rgba(0,0,0,0.1)" }
            },
            y: {
              title: { display: true, text: "Temperatura (°C)" },
              grid: { color: "rgba(0,0,0,0.1)" },
              ticks: {
                stepSize: 1,
                callback: value => `${value}°C`
              },
              suggestedMin: Math.floor(Math.min(...temperaturaFria.slice(-15), ...temperaturaCaliente.slice(-15)) - 1),
              suggestedMax: Math.ceil(Math.max(...temperaturaFria.slice(-15), ...temperaturaCaliente.slice(-15)) + 1),
            },
          },
        }}
      />
    </ChartContainer>
  </ChartCard>

  {/* Monitor de Temperatura */}
  <DataDisplayCard>
    <DataDisplayTitle>🌡️ Temperatura</DataDisplayTitle>
    <DataRow>
      <DataLabel>TEMP FRIA:</DataLabel>
      <DataValue>{temperaturaFria.at(-1) ? `${temperaturaFria.at(-1).toFixed(1)}°C` : '--'}</DataValue>
    </DataRow>
    <DataRow>
      <DataLabel>TEMP CALIENTE:</DataLabel>
      <DataValue>{temperaturaCaliente.at(-1) ? `${temperaturaCaliente.at(-1).toFixed(1)}°C` : '--'}</DataValue>
    </DataRow>
    <DataRow>
      <DataLabel>CICLO:</DataLabel>
      <DataValue>{cicloDia === "dia" ? 'DIURNO' : cicloDia === "noche" ? 'NOCTURNO' : 'AMANECER'}</DataValue>
    </DataRow>
    <DataRow>
      <DataLabel>STATUS:</DataLabel>
      <DataValue>
        {(() => {
          const estado = evaluarEstadoTemperatura();
          if (estado === 'sinDatos') return 'NO_DATA';
          if (estado === 'critico') return 'CRITICO';
          if (estado === 'revisar') return 'REVISAR';
          return 'OPTIMO';
        })()}
      </DataValue>
    </DataRow>
  </DataDisplayCard>
</ChartWithMonitorRow>

      
        {/* Gráfica de Humedad */}
            <ChartWithMonitorRow>
              <ChartCard>
                <ChartTitle>💧 Humedad ({humedad.length} registros)</ChartTitle>
                <ChartContainer>
                  <Line
                    data={{
                      labels: humedad.slice(-15).map((_, i) => {
                        const now = new Date();
                        const ts = new Date(now.getTime() - (humedad.slice(-15).length - i - 1) * 10000);
                        return ts.toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "America/Mexico_City",
                        });
                      }),
                      datasets: [{
                        label: "Humedad (%)",
                        data: humedad.slice(-15).map(v => Math.round(v)),
                        borderColor: "rgb(76, 175, 80)",
                        backgroundColor: "rgba(76, 175, 80, 0.1)",
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: "rgb(76, 175, 80)",
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        x: { 
                          title: { display: true, text: "Tiempo" },
                          grid: { color: "rgba(0,0,0,0.1)" }
                        },
                        y: {
                          title: { display: true, text: "Humedad (%)" },
                          min: 20,
                          max: 90,
                          grid: { color: "rgba(0,0,0,0.1)" }
                        }
                      },
                    }}
                  />
                </ChartContainer>
              </ChartCard>

              {/* Monitor de Humedad */}
              <DataDisplayCard>
                <DataDisplayTitle>💧 Humedad</DataDisplayTitle>
                <DataRow>
                  <DataLabel>HUMEDAD:</DataLabel>
                  <DataValue>{humedad.at(-1) ? `${Math.round(humedad.at(-1))}%` : '--'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>MUDA:</DataLabel>
                  <DataValue>{enMuda ? 'SI' : 'NO'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>MODO:</DataLabel>
                  <DataValue>{enMuda ? 'MUDA' : 'NORMAL'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>STATUS:</DataLabel>
                  <DataValue>
                    {(() => {
                      const estado = evaluarEstadoHumedad();
                      if (estado === 'sinDatos') return 'NO_DATA';
                      if (estado === 'critico') return 'CRITICO';
                      if (estado === 'revisar') return 'REVISAR';
                      return 'OPTIMO';
                    })()}
                  </DataValue>
                </DataRow>
              </DataDisplayCard>
            </ChartWithMonitorRow>

        {/* Gráfica de Luminosidad */}
<ChartWithMonitorRow>               
  <ChartCard>                 
    <ChartTitle>☀️ Luminosidad ({luminosidad.length} registros)</ChartTitle>                 
    <ChartContainer>                   
      <Line                     
        data={{                       
          labels: luminosidad.slice(-15).map((_, i) => {                         
            const now = new Date();                         
            const ts = new Date(now.getTime() - (luminosidad.slice(-15).length - i - 1) * 10000);                         
            return ts.toLocaleTimeString("es-MX", {                           
              hour: "2-digit",                           
              minute: "2-digit",                           
              hour12: false,                           
              timeZone: "America/Mexico_City",                         
            });                       
          }),                       
          datasets: [{                         
            label: "Luminosidad (lux)",                         
            data: luminosidad.slice(-15).map(val => Math.round(val)), // Redondear valores
            borderColor: "rgb(255, 193, 7)",                         
            backgroundColor: "rgba(255, 193, 7, 0.1)",                         
            tension: 0.1,                         
            pointRadius: 4,                         
            pointBackgroundColor: "rgb(255, 193, 7)",                       
          }],                     
        }}                     
        options={{                       
          responsive: true,                       
          maintainAspectRatio: false,                       
          plugins: {                         
            legend: {                           
              position: 'top',                         
            },                       
          },                       
          scales: {                         
            x: {                            
              title: { display: true, text: "Tiempo" },                           
              grid: { color: "rgba(0,0,0,0.1)" }                         
            },                         
            y: {                            
              title: { display: true, text: "Luminosidad (lux)" },                           
              grid: { color: "rgba(0,0,0,0.1)" },
              // Rango mucho más pequeño y fijo
              min: function(context) {
                const data = context.chart.data.datasets[0].data;
                const minVal = Math.min(...data);
                const maxVal = Math.max(...data);
                const average = (minVal + maxVal) / 2;
                
                // Usar solo ±0.5 del promedio para hacerlo muy plano
                return Math.floor(average - 0.5);
              },
              max: function(context) {
                const data = context.chart.data.datasets[0].data;
                const minVal = Math.min(...data);
                const maxVal = Math.max(...data);
                const average = (minVal + maxVal) / 2;
                
                // Usar solo ±0.5 del promedio para hacerlo muy plano
                return Math.ceil(average + 0.5);
              },
              // Ticks más pequeños para mayor precisión visual
              ticks: {
                stepSize: 0.2, // Incrementos muy pequeños
                callback: function(value) {
                  return Math.round(value * 10) / 10; // Mostrar hasta 1 decimal
                }
              }
            },                       
          },                     
        }}                   
      />                 
    </ChartContainer>               
  </ChartCard>                

  {/* Monitor de Luminosidad */}               
  <DataDisplayCard>                 
    <DataDisplayTitle>☀️ Luz</DataDisplayTitle>                 
    <DataRow>                   
      <DataLabel>LUMINOSIDAD:</DataLabel>                   
      <DataValue>
        {luminosidad.at(-1) ? `${Math.round(luminosidad.at(-1))} lux` : '--'}
      </DataValue>                 
    </DataRow>                 
    <DataRow>                   
      <DataLabel>UV STATUS:</DataLabel>                   
      <DataValue>{uvi ? 'ACTIVO' : 'INACTIVO'}</DataValue>                 
    </DataRow>                 
    <DataRow>                   
      <DataLabel>FOCO NORMAL:</DataLabel>                   
      <DataValue>{controlFoco ? 'ON' : 'OFF'}</DataValue>                 
    </DataRow>                 
    <DataRow>                   
      <DataLabel>STATUS:</DataLabel>                   
      <DataValue>                     
        {(() => {                       
          const luzActual = luminosidad.at(-1);                       
          if (!Number.isFinite(luzActual)) return 'NO_DATA';                       
          const luzEval = evaluarParametro(Math.round(luzActual), LIMITES.luminosidad || { bajo: 200, alto: 1000 });                       
          if (luzEval.estado === "critico") return 'CRITICO';                       
          if (luzEval.estado === "revisar") return 'REVISAR';                       
          return 'OPTIMO';                     
        })()}                   
      </DataValue>                 
    </DataRow>               
  </DataDisplayCard>             
</ChartWithMonitorRow>

        {/* Gráfica de UV */}
            <ChartWithMonitorRow>
              <ChartCard>
                <ChartTitle>🔆 Radiación UV ({uviData.length} registros)</ChartTitle>
                <ChartContainer>
                  <Line
                    data={{
                      labels: uviData.slice(-15).map((_, i) => {
                        const now = new Date();
                        const ts = new Date(now.getTime() - (uviData.slice(-15).length - i - 1) * 10000);
                        return ts.toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "America/Mexico_City",
                        });
                      }),
                      datasets: [{
                        label: "Índice UV",
                        data: uviData.slice(-15),
                        borderColor: "rgb(156, 39, 176)",
                        backgroundColor: "rgba(156, 39, 176, 0.1)",
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: "rgb(156, 39, 176)",
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        x: { 
                          title: { display: true, text: "Tiempo" },
                          grid: { color: "rgba(0,0,0,0.1)" }
                        },
                        y: { 
                          title: { display: true, text: "Índice UV" },
                          min: 0,
                          max: 3,
                          grid: { color: "rgba(0,0,0,0.1)" }
                        },
                      },
                    }}
                  />
                </ChartContainer>
              </ChartCard>

              {/* Monitor de UV */}
              <DataDisplayCard>
                <DataDisplayTitle>🔆 UV</DataDisplayTitle>
                <DataRow>
                  <DataLabel>ÍNDICE UV:</DataLabel>
                  <DataValue>{uviData.at(-1) ? `${uviData.at(-1).toFixed(1)} UVI` : '--'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>FOCO UV:</DataLabel>
                  <DataValue>{controlUV ? 'ON' : 'OFF'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>CICLO:</DataLabel>
                  <DataValue>{cicloDia === "dia" ? 'DIURNO' : cicloDia === "noche" ? 'NOCTURNO' : 'AMANECER'}</DataValue>
                </DataRow>
                <DataRow>
                  <DataLabel>STATUS:</DataLabel>
                  <DataValue>
                    {(() => {
                      const uvActual = uviData.at(-1);
                      if (!Number.isFinite(uvActual)) return 'NO_DATA';
                      const uvEval = evaluarParametro(uvActual, { bajo: 0.5, alto: 1.5 });
                      if (uvEval.estado === "critico") return 'CRITICO';
                      if (uvEval.estado === "revisar") return 'REVISAR';
                      return 'OPTIMO';
                    })()}
                  </DataValue>
                </DataRow>
              </DataDisplayCard>
            </ChartWithMonitorRow>

          </LeftSection>

          <RightSection>
            {/* Panel de Control Principal */}
            <ControlPanel>
              <ControlTitle>Panel de Control</ControlTitle>
              
              {/* Botones de Modo */}
              <ModeButtons>
                <ModeButton
                  active={!modoAutomatico}
                  onClick={() => handleModeChange(false)}
                  disabled={!socketConnected}
                  title={!socketConnected ? "Sin conexión al servidor" : "Cambiar a control manual"}
                >
                  <span></span> Manual
                </ModeButton>
                <ModeButton
                  active={modoAutomatico}
                  onClick={() => handleModeChange(true)}
                  disabled={!socketConnected}
                  title={!socketConnected ? "Sin conexión al servidor" : "Cambiar a control automático"}
                >
                  <span></span> Automático
                </ModeButton>
              </ModeButtons>

              <ControlsGrid>
              {/* Control de Luz UV */}
              <ControlSection disabled={modoAutomatico || !socketConnected}>
                <ControlLabel>
                  <span>🔆</span>
                  Luz UV
                </ControlLabel>
                <ControlButton
                  active={controlUV}
                  loading={bloqueoUV}
                  disabled={modoAutomatico || bloqueoUV || !socketConnected}
                  onClick={() => handleControlToggle('uv')}
                  title={
                    !socketConnected ? "Sin conexión al Arduino" : 
                    modoAutomatico ? "Cambiar a modo manual para controlar" :
                    bloqueoUV ? "Procesando..." :
                    controlUV ? "Apagar" : "Encender"
                  }
                >
                  {!socketConnected ? "Sin Conexión" : 
                   bloqueoUV ? "Procesando..." : 
                   (controlUV ? "Apagar " : "Encender ")}
                </ControlButton>
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoUV ? "⏳ Procesando" : 
                     (controlUV ? "✅ Encendida" : "⭕ Apagada")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Control automático</span>}
                </PowerDisplay>
              </ControlSection>

              {/* Control de Foco Principal */}
              <ControlSection disabled={modoAutomatico || !socketConnected}>
                <ControlLabel>
                  <span>💡</span>
                  Iluminación Principal
                </ControlLabel>
                <ControlButton
                  active={controlFoco}
                  loading={bloqueoFoco}
                  disabled={modoAutomatico || bloqueoFoco || !socketConnected}
                  onClick={() => handleControlToggle('foco')}
                  title={
                    !socketConnected ? "Sin conexión al Arduino" : 
                    modoAutomatico ? "Cambiar a modo manual para controlar" :
                    bloqueoFoco ? "Procesando..." :
                    controlFoco ? "Apagar" : "Encender"
                  }
                >
                  {!socketConnected ? "Sin Conexión" :
                   bloqueoFoco ? "Procesando..." : 
                   (controlFoco ? "Apagar" : "Encender")}
                </ControlButton>
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoFoco ? "⏳ Procesando" : 
                     (controlFoco ? "✅ Encendido" : "⭕ Apagado")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Control automático</span>}
                </PowerDisplay>
              </ControlSection>

              {/* Control de Humidificador */}
              <ControlSection disabled={modoAutomatico || !socketConnected}>
                <ControlLabel>
                  <span>💧</span>
                  Humedad
                </ControlLabel>
                <ControlButton
                  active={humidificador}
                  loading={bloqueoHumidificador}
                  disabled={modoAutomatico || bloqueoHumidificador || !socketConnected}
                  onClick={() => handleControlToggle('humidificador')}
                  title={
                    !socketConnected ? "Sin conexión al Arduino" : 
                    modoAutomatico ? "Cambiar a modo manual para controlar" :
                    bloqueoHumidificador ? "Procesando comando..." :
                    humidificador ? "Apagar" : "Encender"
                  }
                >
                  {!socketConnected ? "Sin Conexión" :
                   bloqueoHumidificador ? "Procesando..." : 
                   (humidificador ? "Apagar" : "Encender")}
                </ControlButton>
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoHumidificador ? "⏳ Procesando" : 
                     (humidificador ? "✅ Funcionando" : "⭕ Inactivo")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Control automático</span>}
                </PowerDisplay>
              </ControlSection>

              </ControlsGrid>
              {/* Control de Placa Térmica */}
              <ControlSection disabled={modoAutomatico || !socketConnected}>
                <ControlLabel>
                  <span>🔥</span>
                  Placa Térmica
                </ControlLabel>
                <NumericControl>
                  <NumericButton 
                    onClick={() => handlePlacaChange(placaTermica - 5)} 
                    disabled={modoAutomatico || !socketConnected}
                    title={!socketConnected ? "Sin conexión" : modoAutomatico ? "Modo automático activo" : "Reducir potencia"}
                  >
                    −
                  </NumericButton>
                  <NumericInput
                    type="number"
                    value={placaTermica}
                    min={0}
                    max={100}
                    step={5}
                    disabled={modoAutomatico || !socketConnected}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handlePlacaChange(val);
                    }}
                    title={!socketConnected ? "Sin conexión" : modoAutomatico ? "Modo automático activo" : "Ajustar potencia directamente"}
                  />
                  <NumericButton 
                    onClick={() => handlePlacaChange(placaTermica + 5)} 
                    disabled={modoAutomatico || !socketConnected}
                    title={!socketConnected ? "Sin conexión" : modoAutomatico ? "Modo automático activo" : "Aumentar potencia"}
                  >
                    +
                  </NumericButton>
                </NumericControl>
                <PowerDisplay>
                  Potencia: <strong>{placaTermica}%</strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Control automático</span>}
                </PowerDisplay>
              </ControlSection>
            </ControlPanel>
          </RightSection>
           </MainContainer>
      {/* Notificación Toast */}
      <AnimatePresence>
        {showToast && (
          <ToastContainer
            isAuto={toastMessage.isAuto}
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <ToastMessage>
              <ToastTitle>{toastMessage.title}</ToastTitle>
              <ToastSubtitle>{toastMessage.subtitle}</ToastSubtitle>
            </ToastMessage>
          </ToastContainer>
        )}
      </AnimatePresence>

      {/* Información de Conexión - Fija en la parte inferior */}
      <ConnectionInfo>
        ⏱️ <strong>Tiempo Conectado:</strong> {elapsedTime} | 
        📊 <strong>Datos Recibidos:</strong> {temperaturaFria.length + temperaturaCaliente.length + humedad.length + luminosidad.length + uviData.length} | 
        🔄 <strong>Última Actualización:</strong> {new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Mexico_City",
        })} |
      </ConnectionInfo>

      <Footer />
    </PageContainer>
  );
};

export default Dashboard;