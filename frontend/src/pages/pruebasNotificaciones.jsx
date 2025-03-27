import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

/**
 * Componente para monitorear temperatura y humedad con sistema de alertas
 * Permite actualizar valores manualmente y envía notificaciones cuando están fuera de rango
 */

// Constantes de configuración
const CONFIG = {
  temperatura: {
    minimo: 22,
    maximo: 32,
    unidad: '°C',
    endpoint: 'addtemperatura'
  },
  humedad: {
    minimo: 30,
    maximo: 50,
    unidad: '%',
    endpoint: 'addhumedad'
  },
  luz_uv: {
    minimo: 0.4,
    maximo: 0.7,
    unidad: 'lux',
    endpoint: 'addiluminacion'
  }
};

/**
 * Envía una alerta por correo electrónico
 * @param {string} descripcion - Descripción de la alerta
 * @param {number} valor - Valor que generó la alerta
 * @param {string} tipo - Tipo de alerta ('temperatura' o 'humedad')
 * @param {Function} setAlertStatus - Función para actualizar el estado de la alerta
 */
const enviarEmail = async (descripcion, valor, tipo, setAlertStatus) => {
  setAlertStatus(`Enviando alerta de ${tipo}...`);
  try {
    // Configuramos el payload con compatibilidad para ambos tipos
    const payload = { descripcion, valor, tipo };
    if (tipo === 'temperatura') payload.temperatura = valor;
    if (tipo === 'humedad') payload.humedad = valor;
    if (tipo === 'luzuv') payload.luz_uv = valor;
    
    const response = await fetch('http://localhost:5000/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`Alerta de ${tipo} enviada con éxito:`, result.message);
      setAlertStatus(`Alerta de ${tipo} enviada con éxito`);
    } else {
      console.error('Error en la respuesta del servidor:', result.message);
      setAlertStatus(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error(`Error al enviar la alerta de ${tipo}:`, error);
    setAlertStatus(`Error de conexión: ${error.message}`);
  }
};

/**
 * Envía una medición a la base de datos
 * @param {string} tipo - Tipo de medición ('temperatura' o 'humedad')
 * @param {string} ID_usuario - ID del usuario
 * @param {number} valor - Valor a guardar
 * @param {string} Zona - Zona de la medición
 * @param {string} Marca_tiempo - Marca de tiempo
 */
const enviarMedicion = async (tipo, ID_usuario, valor, Zona, Marca_tiempo) => {
  try {
    // Validar que tenemos todos los datos necesarios
    if (!ID_usuario || valor === undefined || !Zona || !Marca_tiempo) {
      console.error(`Datos incompletos para ${tipo}:`, { ID_usuario, valor, Zona, Marca_tiempo });
      throw new Error('Todos los campos son obligatorios');
    }

    console.log(`Registrando ${tipo} en la base de datos:`, {
      ID_usuario,
      Medicion: valor,
      Zona,
      Marca_tiempo
    });

    // Enviar datos al endpoint correspondiente
    await axios.post(
      `http://localhost:5000/api/${CONFIG[tipo].endpoint}`,
      {
        ID_usuario,
        Medicion: valor,
        Zona,
        Marca_tiempo
      },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    console.log(`${tipo} guardada correctamente.`);
  } catch (error) {
    console.error(`Error al guardar ${tipo}:`, error);
  }
};

/**
 * Gestiona una notificación (registro, alerta y notificación al usuario)
 * @param {string} tipo - Tipo de medición ('temperatura' o 'humedad')
 * @param {number} valor - Valor de la medición
 * @param {string} ID_usuario - ID del usuario
 * @param {Function} setAlertStatus - Función para actualizar el estado de la alerta
 * @param {Function} setLastAlertValue - Función para guardar el último valor que generó alerta
 * @param {number|null} lastAlertValue - Último valor que generó alerta
 */
const gestionarNotificacion = async (tipo, valor, ID_usuario, setAlertStatus, setLastAlertValue, lastAlertValue) => {
  const Marca_tiempo = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const config = CONFIG[tipo];
  
  // Guardar siempre la medición en la base de datos
  await enviarMedicion(tipo, ID_usuario, valor, 'Zona 1', Marca_tiempo);

  const valorFormateado = valor.toFixed(2);
  console.log(`${tipo} formateada:`, valorFormateado);

  // Evitar alertas repetidas para valores similares
  if (lastAlertValue !== null && Math.abs(valor - lastAlertValue) < 1) {
    console.log(`${tipo} similar a la anterior, no se enviará alerta.`);
    return;
  }

  // Verificar si el valor está fuera de rango
  if (valor < config.minimo || valor > config.maximo) {
    try {
      // Enviar alerta por correo
      await enviarEmail(`${tipo} fuera de rango`, valor, tipo, setAlertStatus);

      // Crear una notificación en el sistema
      const notificacionResponse = await axios.post(
        'http://localhost:5000/api/addNotification',
        {
          tipo,
          descripcion: `${tipo} fuera de rango: ${valorFormateado}${config.unidad}`,
          time_alert: Marca_tiempo,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Asociar la notificación al usuario
      const idNotificacion = notificacionResponse.data.id_notificacion;
      if (idNotificacion) {
        await axios.post(
          'http://localhost:5000/api/addNotificationUser',
          { id_notificacion: idNotificacion, id_user: ID_usuario },
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Relación notificación-usuario guardada con éxito');
      }

      setLastAlertValue(valor);
    } catch (error) {
      console.error(`Error al gestionar la notificación de ${tipo}:`, error);
      setAlertStatus(`Error de conexión: ${error.message}`);
    }
  }
};

/**
 * Componente para monitoreo de una variable (temperatura o humedad)
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tipo - Tipo de variable ('temperatura' o 'humedad')
 * @param {number} props.valor - Valor actual
 * @param {Function} props.setValor - Función para actualizar el valor
 */
const MonitoreoComponente = ({ tipo, valor, setValor }) => {
  const [inputValue, setInputValue] = useState(valor.toString());
  const [lastAlertValue, setLastAlertValue] = useState(null);
  const [alertStatus, setAlertStatus] = useState('');
  const config = CONFIG[tipo];

  const token = localStorage.getItem('token');
  const ID_usuario = token ? jwtDecode(token).id : '';

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleUpdateValue = () => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue)) {
      setValor(newValue);
      gestionarNotificacion(tipo, newValue, ID_usuario, setAlertStatus, setLastAlertValue, lastAlertValue);
    } else {
      setAlertStatus('Por favor ingrese un número válido');
      setTimeout(() => setAlertStatus(''), 3000);
    }
  };

  // Capitalizar la primera letra para el título
  const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  return (
    <div className={`Monitoreo${tipoCapitalizado}`}>
      <h2>Monitoreo De {tipoCapitalizado}</h2>
      <div>
        <label htmlFor={tipo}>{tipoCapitalizado} ({config.unidad}): </label>
        <input 
          id={tipo} 
          type="number" 
          value={inputValue} 
          onChange={handleInputChange} 
          step="0.1" 
        />
        <button onClick={handleUpdateValue}>Actualizar</button>
      </div>
      <p>{tipoCapitalizado} actual: <span>{valor.toFixed(2)}{config.unidad}</span></p>
      {alertStatus && <p>{alertStatus}</p>}
    </div>
  );
};

/**
 * Componente principal que integra el monitoreo de temperatura y humedad
 */
const PruebasNotificaciones = () => {
  const [temperatura, setTemperatura] = useState(25);
  const [humedad, setHumedad] = useState(40);
  const [luz_uv, setLuzUV] = useState(0.5);

  
  return (
    <div className="PruebasNotificaciones">
      <MonitoreoComponente 
        tipo="temperatura" 
        valor={temperatura} 
        setValor={setTemperatura} 
      />
      <hr />
      <MonitoreoComponente 
        tipo="humedad" 
        valor={humedad} 
        setValor={setHumedad} 
      />
        <hr />
      <MonitoreoComponente 
        tipo="luz_uv" 
        valor={luz_uv} 
        setValor={setLuzUV} 
      />
    </div>
  );
};

export default PruebasNotificaciones;