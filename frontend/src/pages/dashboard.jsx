import React, { useState, useEffect, useRef, useMemo, useCallback} from "react";
import { io } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
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

const CACHE_KEYS = {
  TEMP_FRIA: 'gecko_temp_fria_cache',
  TEMP_CALIENTE: 'gecko_temp_caliente_cache', 
  HUMEDAD: 'gecko_humedad_cache',
  LUMINOSIDAD: 'gecko_luminosidad_cache',
  UV: 'gecko_uv_cache',
  ESTADOS: 'gecko_estados_cache',
  CICLO: 'gecko_ciclo_cache',
  MUDA: 'gecko_muda_cache',
  TIMESTAMP: 'gecko_cache_timestamp'
};

// ✅ OPTIMIZACIÓN: Flag para debugging
const DEBUG_MODE = false;

// ✅ OPTIMIZACIÓN: Función de cache con debounce incorporado
const saveToCache = (key, data) => {
  try {
    const now = Date.now();
    const lastSave = parseInt(localStorage.getItem(`${key}_last_save`) || '0');
    
    // Solo guardar si han pasado al menos 2 segundos desde la última vez
    if (now - lastSave > 2000) {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, now.toString());
      localStorage.setItem(`${key}_last_save`, now.toString());
      if (DEBUG_MODE) console.log(`💾 Cache guardado: ${key}`);
    }
  } catch (error) {
    console.warn('⚠️ Error guardando caché:', error);
  }
};

const loadFromCache = (key, defaultValue = []) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : defaultValue;
    }
  } catch (error) {
    console.warn('⚠️ Error cargando caché:', error);
  }
  return defaultValue;
};

const isCacheRecent = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const THIRTY_MINUTES = 30 * 60 * 1000;
    return cacheAge < THIRTY_MINUTES;
  } catch {
    return false;
  }
};

const evaluarParametro = (valor, limites, esTemperatura = false, zona = null) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return { 
      estado: 'sin-datos', 
      color: '#6c757d', 
      icono: '❓',
      mensaje: 'Sin datos'
    };
  }

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

// ✅ OPTIMIZACIÓN: Mensajes estáticos fuera del componente
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
  return "linear-gradient(135deg, #607d8b, #90a4ae)";
};

const Dashboard = () => {
  const [temperaturaFria, setTemperaturaFria] = useState(() => loadFromCache(CACHE_KEYS.TEMP_FRIA));
  const [temperaturaCaliente, setTemperaturaCaliente] = useState(() => loadFromCache(CACHE_KEYS.TEMP_CALIENTE));
  const [humedad, setHumedad] = useState(() => loadFromCache(CACHE_KEYS.HUMEDAD));
  const [luminosidad, setLuminosidad] = useState(() => loadFromCache(CACHE_KEYS.LUMINOSIDAD));
  const [uviData, setUVIData] = useState(() => loadFromCache(CACHE_KEYS.UV));
  const [, setLuzUV] = useState(false);
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
  const [datosListos, setDatosListos] = useState(isCacheRecent());

  // ✅ OPTIMIZACIÓN: useRef para datos que no necesitan re-renders
  const socket = useRef(null);
  const lastCacheSave = useRef(0);
  const modoAutomaticoRef = useRef(modoAutomatico);

  // ✅ OPTIMIZACIÓN: Actualizar ref cuando cambie el estado
  useEffect(() => {
    modoAutomaticoRef.current = modoAutomatico;
  }, [modoAutomatico]);


  const mensajesTemperatura = useMemo(() => [
    {
      zona: "fria",
      label: "Zona Fría",
      getValor: temperaturaFria,
      icon: "❄️",
    },
    {
      zona: "caliente",
      label: "Zona Caliente",
      getValor: temperaturaCaliente,
      icon: "🔥",
    },
  ], [temperaturaFria, temperaturaCaliente]); // ✅ SÍ dependen de los arrays para actualizar

  const [mensajeTemp, setMensajeTemp] = useState(mensajesTemperatura[0]);

  // ✅ CORRECCIÓN: useEffect que SÍ se actualice cuando cambien los datos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setMensajeTemp((prev) => {
        const index = mensajesTemperatura.indexOf(prev);
        return mensajesTemperatura[(index + 1) % mensajesTemperatura.length];
      });
    }, 6000);
    return () => clearInterval(intervalo);
  }, [mensajesTemperatura]); // ✅ SÍ necesita dependencias para datos actualizados

  // ✅ OPTIMIZACIÓN: Cache con debounce usando useRef
  const debouncedSaveToCache = useCallback((key, data) => {
    const now = Date.now();
    if (now - lastCacheSave.current > 2000) {
      saveToCache(key, data);
      lastCacheSave.current = now;
    }
  }, []);


  useEffect(() => {
    const estados = {
      cicloDia,
      enMuda,
      placaTermica,
      humidificador,
      controlUV,
      controlFoco,
      modoAutomatico
    };
    debouncedSaveToCache(CACHE_KEYS.ESTADOS, estados);
  }, [cicloDia, enMuda, placaTermica, humidificador, controlUV, controlFoco, modoAutomatico, debouncedSaveToCache]);

  // ✅ CORRECCIÓN: Chart data que SÍ se actualice con nuevos datos
  const temperaturaChartData = useMemo(() => ({
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
  }), [temperaturaFria, temperaturaCaliente]);

  const humedadChartData = useMemo(() => ({
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
  }), [humedad]);
 
  useEffect(() => {
    if (temperaturaFria.length > 0) {
      debouncedSaveToCache(CACHE_KEYS.TEMP_FRIA, temperaturaFria);
    }
  }, [temperaturaFria, debouncedSaveToCache]);

  useEffect(() => {
    if (temperaturaCaliente.length > 0) {
      debouncedSaveToCache(CACHE_KEYS.TEMP_CALIENTE, temperaturaCaliente);
    }
  }, [temperaturaCaliente, debouncedSaveToCache]);

  useEffect(() => {
    if (humedad.length > 0) {
      debouncedSaveToCache(CACHE_KEYS.HUMEDAD, humedad);
    }
  }, [humedad, debouncedSaveToCache]);

  useEffect(() => {
    if (luminosidad.length > 0) {
      debouncedSaveToCache(CACHE_KEYS.LUMINOSIDAD, luminosidad);
    }
  }, [luminosidad, debouncedSaveToCache]);

  useEffect(() => {
    if (uviData.length > 0) {
      debouncedSaveToCache(CACHE_KEYS.UV, uviData);
    }
  }, [uviData, debouncedSaveToCache]);

  // ✅ OPTIMIZACIÓN: Rotación de mensajes info sin dependencias
  useEffect(() => {
    const interval = setInterval(() => {
      setMensajeActual(prev => {
        const index = mensajesInfo.indexOf(prev);
        return mensajesInfo[(index + 1) % mensajesInfo.length];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [datosListos, temperaturaFria.length, temperaturaCaliente.length, humedad.length]);

  const [startTime] = useState(() => {
    const newStart = Date.now();
    localStorage.setItem('sessionStartTime', newStart.toString());
    return newStart;
  });
  const [elapsedTime, setElapsedTime] = useState("0s");

  const navigate = useNavigate();

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

  useEffect(() => {
    const savedMode = localStorage.getItem("modoGecko");
    if (savedMode === "manual") {
      setModoAutomatico(false);
    } else {
      setModoAutomatico(true);
    }
  }, []);

  // ✅ OPTIMIZACIÓN CLAVE: useEffect del socket SIN dependencias para evitar reconexiones
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

    if (DEBUG_MODE) console.log('✅ Conectando usuario:', ID_usuario);
    
    if (datosListos && DEBUG_MODE) {
      console.log('🎯 Datos en caché disponibles - mostrando inmediatamente');
    }

    socket.current = io("http://localhost:5004", { 
      auth: { 
        ID_usuario: ID_usuario,
        token: token
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      timeout: 30000,           
      reconnection: true,       
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    socket.current.on("connect", () => {
      if (DEBUG_MODE) console.log('✅ Socket conectado correctamente');
      setSocketConnected(true);
      
      socket.current.emit('user-identification', {
        ID_usuario: ID_usuario,
        timestamp: new Date().toISOString(),
        source: 'dashboard'
      });

      setTimeout(() => {
        const mode = modoAutomaticoRef.current ? "automatico" : "manual";
        if (DEBUG_MODE) console.log(`⚙️ Enviando modo inicial: ${mode}`);
        socket.current.emit("modo", mode);
      }, 1000);
    });

    socket.current.on("connect_error", (error) => {
      console.error('❌ Error de conexión:', error.message);
      setSocketConnected(false);
    });

    socket.current.on("disconnect", (reason) => {
      if (DEBUG_MODE) console.log('🔴 Socket desconectado:', reason);
      setSocketConnected(false);
    });

    socket.current.on("user-confirmed", (data) => {
      if (DEBUG_MODE) console.log('✅ Usuario confirmado:', data);
    });

    // ✅ OPTIMIZACIÓN: Reducir logging en sensor-data
    socket.current.on("sensor-data", async (data) => {
      if (data.ID_usuario && data.ID_usuario !== ID_usuario) return;

      if (data.zona === "muda") {
        const enMudaValue = data.valor === 1 || data.valor === true || data.valor === "1" || data.valor === "true";
        setEnMuda(enMudaValue);
        return;
      }

      if (data.zona === "ciclo") {
        const ciclo = typeof data.valor === 'string' ? data.valor.toLowerCase() : data.valor;
        setCicloDia(ciclo);
        if (DEBUG_MODE) console.log("📥 Ciclo recibido:", ciclo);
        return;
      }
      
      const valor = parseFloat(data.valor);
      if (isNaN(valor)) {
        if (DEBUG_MODE) console.warn('⚠️ Valor inválido recibido:', data.valor);
        return;
      }
      
      if (data.zona === "temperatura" || 
          (data.topic && (
            data.topic.includes("zonafria") || 
            data.topic.includes("fria") ||
            data.topic.includes("zonacaliente") || 
            data.topic.includes("caliente")
          ))) {
        
        let zona = null;
        if (data.topic && (data.topic.includes("zonafria") || data.topic.includes("fria"))) {
          zona = "fria";
        } else if (data.topic && (data.topic.includes("zonacaliente") || data.topic.includes("caliente"))) {
          zona = "caliente";
        } else if (data.zona === "temperatura") {
          zona = data.tipo || "fria"; 
        }
        
        if (zona === "fria") {
          if (DEBUG_MODE) console.log('❄️ Temperatura fría:', valor);
          setTemperaturaFria(prev => [...prev.slice(-49), valor]);
        } else if (zona === "caliente") {
          if (DEBUG_MODE) console.log('🔥 Temperatura caliente:', valor);
          setTemperaturaCaliente(prev => [...prev.slice(-49), valor]);
        }
        return;
      }
  
      if (data.zona === "humedad" || (data.topic && data.topic.includes("humedad"))) {
        if (DEBUG_MODE) console.log('💧 Humedad recibida:', valor);
        setHumedad(prev => [...prev.slice(-49), valor]);
      } else if (data.zona === "luminosidad" || (data.topic && data.topic.includes("luminosidad"))) {
        if (DEBUG_MODE) console.log('☀️ Luminosidad recibida:', valor);
        setLuminosidad(prev => [...prev.slice(-49), valor]);
      } else if (data.zona === "luz_uv" || (data.topic && data.topic.includes("uvi"))) {
        if (DEBUG_MODE) console.log('🔆 UV recibido:', valor);
        setLuzUV(valor > 0);
        setUVIData(prev => [...prev.slice(-49), valor]);
      }
    });

    socket.current.on("actuador-data", (data) => {
      if (DEBUG_MODE) console.log('🎛️ Datos de actuador:', data);
      
      if (data.ID_usuario && data.ID_usuario !== ID_usuario) {
        return;
      }

      const { zona, valor } = data;
      const numeric = typeof valor === "string" ? parseInt(valor) : valor;
      
      switch (zona) {
        case "placaP": 
        case "placa": 
          if (DEBUG_MODE) console.log('🔥 Actualizando placa térmica:', numeric);
          setPlacaTermica(numeric); 
          break;
        case "humidificadorP": 
        case "humidificador":
          if (DEBUG_MODE) console.log('💧 Actualizando humidificador:', numeric === 1);
          setHumidificador(numeric === 1); 
          break;
        case "focoP": 
        case "foco":
          if (DEBUG_MODE) console.log('💡 Actualizando foco:', numeric === 1);
          setControlFoco(numeric === 1); 
          break;
        case "focouviP": 
        case "focouvi":
        case "uv":
          if (DEBUG_MODE) console.log('🔆 Actualizando UV:', numeric === 1);
          setControlUV(numeric === 1); 
          break;
        default: 
          if (DEBUG_MODE) console.warn('⚠️ Zona de actuador desconocida:', zona);
          break;
      }
    });

    const loadInitialData = async () => {
      if (DEBUG_MODE) console.log('📥 Cargando datos iniciales...');
      
      if (datosListos && 
          temperaturaFria.length > 0 && 
          temperaturaCaliente.length > 0 && 
          humedad.length > 0) {
        if (DEBUG_MODE) console.log('🎯 Usando datos del caché - omitiendo carga inicial');
        setDatosListos(true);
        return;
      }
      
      try {
        // TEMPERATURA
        if (DEBUG_MODE) console.log('📊 Solicitando datos de temperatura...');
        const tempResponse = await fetch(`http://localhost:5000/api/historial/temperatura?ID_usuario=${ID_usuario}`);
        if (tempResponse.ok) {
          const tempData = await tempResponse.json();
          if (DEBUG_MODE) console.log('📊 Datos de temperatura recibidos:', tempData.length, 'registros');
          
          if (tempData.length > 0) {
            const fria = tempData.filter(d => d.zona === 'fria' || d.zona === 'fría').map(d => d.medicion);
            const caliente = tempData.filter(d => d.zona === 'caliente').map(d => d.medicion);
            
            if (DEBUG_MODE) {
              console.log('❄️ Temperaturas frías encontradas:', fria.length);
              console.log('🔥 Temperaturas calientes encontradas:', caliente.length);
            }
            
            setTemperaturaFria(fria.slice(-50));
            setTemperaturaCaliente(caliente.slice(-50));
          }
        } else {
          console.error('❌ Error al cargar temperatura:', tempResponse.status);
        }

        if (DEBUG_MODE) console.log('📊 Solicitando datos de humedad...');
        const humResponse = await fetch(`http://localhost:5000/api/historial/humedad?ID_usuario=${ID_usuario}`);
        if (humResponse.ok) {
          const humData = await humResponse.json();
          if (DEBUG_MODE) console.log('📊 Datos de humedad recibidos:', humData.length, 'registros');
          
          if (humData.length > 0) {
            const humedadValues = humData.map(d => d.medicion);
            setHumedad(humedadValues.slice(-50));
          }
        } else {
          console.error('❌ Error al cargar humedad:', humResponse.status);
        }

        if (DEBUG_MODE) console.log('📊 Solicitando datos de luminosidad...');
        try {
          let lumResponse = await fetch(`http://localhost:5000/api/historial/luminosidad?ID_usuario=${ID_usuario}`);
          if (!lumResponse.ok) {
            lumResponse = await fetch(`http://localhost:5000/api/historial/luz?ID_usuario=${ID_usuario}`);
          }
          
          if (lumResponse.ok) {
            const lumData = await lumResponse.json();
            if (DEBUG_MODE) console.log('📊 Datos de luminosidad recibidos:', lumData.length, 'registros');
            
            if (lumData.length > 0) {
              const lumValues = lumData.map(d => d.medicion);
              setLuminosidad(lumValues.slice(-50));
            }
          } else {
            console.warn('⚠️ No se pudo cargar historial de luminosidad');
          }
        } catch (error) {
          console.error('❌ Error cargando luminosidad:', error);
        }

        if (DEBUG_MODE) console.log('📊 Solicitando datos de UV...');
        try {
          let uvResponse = await fetch(`http://localhost:5000/api/historial/luz_uv?ID_usuario=${ID_usuario}`);
          if (!uvResponse.ok) {
            uvResponse = await fetch(`http://localhost:5000/api/historial/uv?ID_usuario=${ID_usuario}`);
          }
          
          if (uvResponse.ok) {
            const uvData = await uvResponse.json();
            if (DEBUG_MODE) console.log('📊 Datos de UV recibidos:', uvData.length, 'registros');
            
            if (uvData.length > 0) {
              const uvValues = uvData.map(d => d.medicion);
              setUVIData(uvValues.slice(-50));
            }
          } else {
            console.warn('⚠️ No se pudo cargar historial de UV');
          }
        } catch (error) {
          console.error('❌ Error cargando UV:', error);
        }

      } catch (error) {
        console.error("❌ Error general cargando datos iniciales:", error);
      }
    };

    loadInitialData();

    // CLEANUP
    return () => {
      if (socket.current) {
        if (DEBUG_MODE) console.log('🔌 Desconectando socket...');
        socket.current.disconnect();
        socket.current = null;
      }
      setSocketConnected(false);
    };
  }, []); 


  const handlePlacaChange = useCallback((newValue) => {
    const val = Math.max(0, Math.min(100, newValue));
    setPlacaTermica(val);
    if (!modoAutomatico && socket.current?.connected) {
      if (DEBUG_MODE) console.log(`🔥 Enviando comando placa térmica: ${val}%`);
      socket.current.emit("placa-termica", { temperatura: val });
    }
  }, [modoAutomatico]);

  const handleControlToggle = useCallback((type) => {
    if (modoAutomatico) {
      if (DEBUG_MODE) console.log('⚠️ Modo automático activo, comando ignorado');
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
        if (DEBUG_MODE) console.log(`🔆 Enviando comando UV: ${estadoUV ? 'ON' : 'OFF'}`);
        
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
        if (DEBUG_MODE) console.log(`💡 Enviando comando foco: ${estadoFoco ? 'ON' : 'OFF'}`);
        
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
        if (DEBUG_MODE) console.log(`💧 Enviando comando humidificador: ${estadoHum ? 'ON' : 'OFF'}`);
        
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
  }, [modoAutomatico, controlUV, controlFoco, humidificador, bloqueoUV, bloqueoFoco, bloqueoHumidificador]);

  const handleModeChange = useCallback((isAutomatic) => {
    setModoAutomatico(isAutomatic);
    localStorage.setItem("modoGecko", isAutomatic ? "auto" : "manual");
    
    if (socket.current?.connected) {
      const mode = isAutomatic ? "automatico" : "manual";
      if (DEBUG_MODE) console.log(`🔄 Cambiando modo a: ${mode.toUpperCase()}`);
      socket.current.emit("modo", mode);
    }
    
    showModeToast(isAutomatic, setShowToast, setToastMessage);
  }, []);

  // ✅ OPTIMIZACIÓN: Funciones de evaluación con useMemo
  const evaluarEstadoTemperatura = useMemo(() => {
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
  }, [temperaturaFria, temperaturaCaliente]);

  const evaluarEstadoHumedad = useMemo(() => {
    const humedadActual = humedad.at(-1);
    
    if (!Number.isFinite(humedadActual)) {
      return 'sinDatos';
    }
    
    const limitesHumedad = LIMITES.humedad?.[enMuda ? "muda" : "normal"];
    const humedadEval = evaluarParametro(humedadActual, limitesHumedad);
    
    return humedadEval.estado;
  }, [humedad, enMuda]);

  // ✅ OPTIMIZACIÓN: Solo log cuando cambian significativamente los arrays
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('📊 Estado actual de arrays:');
      console.log('❄️ Temperatura fría:', temperaturaFria.length, 'elementos', temperaturaFria.slice(-3));
      console.log('🔥 Temperatura caliente:', temperaturaCaliente.length, 'elementos', temperaturaCaliente.slice(-3));
      console.log('💧 Humedad:', humedad.length, 'elementos', humedad.slice(-3));
      console.log('☀️ Luminosidad:', luminosidad.length, 'elementos', luminosidad.slice(-3));
      console.log('🔆 UV:', uviData.length, 'elementos', uviData.slice(-3));
    }
  }, []); 


  return (
    <PageContainer>
      {/* Header */}
      <Header showUserIcon/>
        {/* Tarjetas de Estado Superior */}
        <TopCards>
          {/* Ciclo */}
<StatusCard
  bgColor={(() => {
    switch (cicloDia?.trim().toLowerCase()) {
      case "dia":
         return "linear-gradient(135deg, #64b5f6, #fff176)";
      case "noche":
        return "linear-gradient(135deg,rgba(40, 52, 147, 0.64),rgba(105, 27, 154, 0.63))";
      case "diaam":
      case "amanecer":
        return "linear-gradient(135deg, #fbc02d, #ffe082)";
      default:
        return "linear-gradient(135deg, #757575, #9e9e9e)";
    }
  })()}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  <StatusTitle>Ciclo</StatusTitle>
  <StatusValue style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {(() => {
      const val = cicloDia?.trim().toLowerCase() || "";
      const iconStyle = { filter: "drop-shadow(0 0 2px white)" };
      switch (val) {
        case "dia":
          return <>DÍA <CycleIcon src={dia} alt="Día" style={iconStyle} /></>;
        case "noche":
          return <>NOCHE <CycleIcon src={noche} alt="Noche" style={iconStyle} /></>;
        case "diaam":
        case "amanecer":
          return <>AMANECER <CycleIcon src={dia} alt="Amanecer" style={iconStyle} /></>;
        default:
          return <>SIN DATOS</>;
      }
    })()}
  </StatusValue>
</StatusCard>

          {/* Estado Temperatura */}
<StatusCard
  bgColor={(() => {
    const val = mensajeTemp.getValor.at(-1);
    const evalTemp = evaluarParametro(val, LIMITES.temperatura[mensajeTemp.zona], true, cicloDia);
    return evalTemp.color === "red"
      ? "linear-gradient(135deg,rgba(183, 28, 28, 0.7),rgba(244, 67, 54, 0.7))"
      : evalTemp.color === "orange"
      ? "linear-gradient(135deg,rgba(255, 153, 0, 0.75),rgba(255, 193, 7, 0.75))"
      : evalTemp.color === "green"
      ? "linear-gradient(135deg,rgba(46, 125, 50, 0.7), #66bb6a)"
      : "linear-gradient(135deg, #757575, #9e9e9e)";
  })()}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
>
  <StatusTitle>Temperatura - {mensajeTemp.label}</StatusTitle>
  <StatusValue style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
      Actual: {Number.isFinite(mensajeTemp.getValor.at(-1)) ? `${mensajeTemp.getValor.at(-1).toFixed(1)}°C` : "--"}
    </div>
    <div style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap", textAlign: "center" }}>
      {(() => {
        const val = mensajeTemp.getValor.at(-1);
        if (!Number.isFinite(val)) {
          return (
            <>
              SIN DATOS
              <StatusIcon src={advertencia} alt="Sin datos" />
            </>
          );
        }

        const evalTemp = evaluarParametro(val, LIMITES.temperatura[mensajeTemp.zona], true, cicloDia);

        if (evalTemp.color === "red") {
          return (
            <>
              ESTADO CRÍTICO
              <StatusIcon src={peligro} alt="Crítico" />
            </>
          );
        } else if (evalTemp.color === "orange") {
          return (
            <>
              REVISAR ESTADO
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
      return "linear-gradient(135deg, #757575, #9e9e9e)";
    }

    const limitesHumedad = LIMITES.humedad?.[enMuda ? "muda" : "normal"];
    const humedadEval = evaluarParametro(humedadActual, limitesHumedad);

    return humedadEval.color === "red"
      ? "linear-gradient(135deg,rgba(183, 28, 28, 0.7),rgba(244, 67, 54, 0.7))"
      : humedadEval.color === "orange"
      ? "linear-gradient(135deg,rgba(255, 153, 0, 0.7),rgba(255, 193, 7, 0.7))"
      : "linear-gradient(135deg,rgba(0, 121, 107, 0.7),rgba(77, 182, 172, 0.7))";
  })()}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
>
  <StatusTitle>Humedad</StatusTitle>
  <StatusValue style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
      Actual: {Number.isFinite(humedad.at(-1)) ? `${Math.round(humedad.at(-1))}%` : "--"}
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
        {/* Gráfica de Temperatura - ✅ OPTIMIZADA */}
<ChartWithMonitorRow>
  <ChartCard>
    <ChartTitle>🌡️ Temperatura ({temperaturaFria.length + temperaturaCaliente.length} registros)</ChartTitle>
    <ChartContainer>
      <Line
        data={temperaturaChartData}
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
      <DataLabel>STATUS:</DataLabel>
      <DataValue>
        {(() => {
          if (evaluarEstadoTemperatura === 'sinDatos') return 'NO_DATA';
          if (evaluarEstadoTemperatura === 'critico') return 'CRITICO';
          if (evaluarEstadoTemperatura === 'revisar') return 'REVISAR';
          return 'OPTIMO';
        })()}
      </DataValue>
    </DataRow>
  </DataDisplayCard>
</ChartWithMonitorRow>

        {/* Gráfica de Humedad - ✅ OPTIMIZADA */}
            <ChartWithMonitorRow>
              <ChartCard>
                <ChartTitle>💧 Humedad ({humedad.length} registros)</ChartTitle>
                <ChartContainer>
                  <Line
                    data={humedadChartData}
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
                  <DataLabel>STATUS:</DataLabel>
                  <DataValue>
                    {(() => {
                      if (evaluarEstadoHumedad === 'sinDatos') return <>SIN DATOS <StatusIcon src={advertencia} /></>;
                      if (evaluarEstadoHumedad === 'alto' || evaluarEstadoHumedad === 'bajo') return <>REVISAR <StatusIcon src={advertencia} /></>;
                      return <>ESTADO IDEAL <StatusIcon src={ok} /></>;
                    })()}
                  </DataValue>
                </DataRow>
              </DataDisplayCard>
            </ChartWithMonitorRow>

   {/* 🔧 GRÁFICA DE LUMINOSIDAD CORREGIDA */}
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
            data: luminosidad.slice(-15),
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
              // 🔧 CORRECCIÓN: Rango fijo más amplio y sin decimales
              min: function(context) {
                if (!context?.chart?.data?.datasets?.[0]?.data?.length) return 50;
                const data = context.chart.data.datasets[0].data;
                const minVal = Math.min(...data);
                return Math.floor(minVal - 5); // Buffer de 5 unidades
              },
              max: function(context) {
                if (!context?.chart?.data?.datasets?.[0]?.data?.length) return 70;
                const data = context.chart.data.datasets[0].data;
                const maxVal = Math.max(...data);
                return Math.ceil(maxVal + 5); // Buffer de 5 unidades
              },
              ticks: {
                stepSize: 1, // Pasos de 1 en 1, sin decimales
                callback: function(value) {
                  return Math.round(value); // Solo números enteros
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
                  <DataValue>{luminosidad.at(-1) ? `${Math.round(luminosidad.at(-1))} lux` : '--'}</DataValue>
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
                      const luzEval = evaluarParametro(luzActual, LIMITES.luminosidad || { bajo: 200, alto: 1000 });
                      if (luzEval.estado === "critico") return 'CRITICO';
                      if (luzEval.estado === "revisar") return 'REVISAR';
                      return 'OPTIMO';
                    })()}
                  </DataValue>
                </DataRow>
              </DataDisplayCard>
            </ChartWithMonitorRow>         


         {/* 🔧 GRÁFICA DE UV CORREGIDA */}
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
                          // 🔧 CORRECCIÓN: Línea centrada, no en el fondo
                          min: -0.5, // Permitir valores negativos para centrar la línea
                          max: 2.5,  // Rango más amplio
                          grid: { color: "rgba(0,0,0,0.1)" },
                          ticks: {
                            stepSize: 0.5,
                            callback: function(value) {
                              return value.toFixed(1);
                            }
                          }
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
    <DataValue>
      {cicloDia === "dia" ? 'DIURNO' : cicloDia === "noche" ? 'NOCTURNO' : 'AMANECER'}
    </DataValue>
  </DataRow>

  <DataRow>
    <DataLabel>STATUS:</DataLabel>
    <DataValue>
      {(() => {
        const uvActual = uviData.at(-1);
        if (!Number.isFinite(uvActual)) {
          return <>SIN DATOS <StatusIcon src={advertencia} /></>;
        }

        const limitesUV = LIMITES.luz_uv?.[cicloDia] || { min: 0, max: 0 };
        const uvEval = evaluarParametro(uvActual, limitesUV);

        if (uvEval.color === "red") {
          return <>ESTADO CRÍTICO <StatusIcon src={peligro} /></>;
        }
        if (uvEval.color === "orange") {
          return <>REVISAR UV <StatusIcon src={advertencia} /></>;
        }
        return <>ESTADO IDEAL <StatusIcon src={ok} /></>;
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
              {/* Control de Luz UV - ESTADOS REALES */}
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
                {/* 🔧 ESTADO REAL DEL ACTUADOR */}
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoUV ? "⏳ Procesando" : 
                     (controlUV ? "✅ Encendida" : "⭕ Apagada")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Automático</span>}
                </PowerDisplay>
              </ControlSection>

              {/* Control de Foco Principal - ESTADOS REALES */}
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
                {/* 🔧 ESTADO REAL DEL ACTUADOR */}
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoFoco ? "⏳ Procesando" : 
                     (controlFoco ? "✅ Encendido" : "⭕ Apagado")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Automático</span>}
                </PowerDisplay>
              </ControlSection>

              {/* Control de Humidificador - ESTADOS REALES */}
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
                {/* 🔧 ESTADO REAL DEL ACTUADOR */}
                <PowerDisplay>
                  <strong>
                    {!socketConnected ? "❌ Desconectado" :
                     bloqueoHumidificador ? "⏳ Procesando" : 
                     (humidificador ? "✅ Funcionando" : "⭕ Inactivo")}
                  </strong>
                  {modoAutomatico && <span style={{color: '#28a745'}}> • Automático</span>}
                </PowerDisplay>
              </ControlSection>

              </ControlsGrid>
              {/* Control de Placa Térmica - ESTADO REAL */}
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
                {/*  ESTADO REAL DE LA PLACA TÉRMICA */}
                <PowerDisplay>
                  Potencia Real: <strong>{placaTermica}%</strong>
                  {!modoAutomatico && placaTermica !== setPlacaTermica && (
                    <span style={{color: '#ff9800'}}> • Enviando: {placaTermica}%</span>
                  )}
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

      {/* INFORMACIÓN DE CONEXIÓN MEJORADA */}
<ConnectionInfo>
  ⏱️ <strong>Sesión activa:</strong> {elapsedTime} |
  🔄 <strong>Última actualización:</strong> {new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Mexico_City",
  })} |
  🦎 <strong>Muda:</strong> {enMuda ? 'Sí' : 'No'} |
      <strong>Modo:</strong> {modoAutomatico ? 'Automático' : 'Manual'} |
</ConnectionInfo>


      <Footer />
    </PageContainer>
  );
};

export default Dashboard;