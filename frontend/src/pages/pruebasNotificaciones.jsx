import { useState, useEffect } from 'react';

const TemperaturaAlert = ({ temperatura, setTemperatura }) => {
  // Estado para el valor del input separado del valor actual de temperatura
  const [inputValue, setInputValue] = useState(temperatura.toString());
  const [lastAlertValue, setLastAlertValue] = useState(null);
  const [alertStatus, setAlertStatus] = useState('');
  const [cooldown, setCooldown] = useState(false);
  
  const enviar_temperatura_alert = async (temp) => {
    setAlertStatus('Enviando alerta...');
    try {
      // Asegurar que la temperatura se envía como string con 2 decimales
      const temperaturaFormateada = temp.toFixed(2);
      
      console.log("Enviando temperatura formateada:", temperaturaFormateada);
      
      const response = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          temperatura: parseFloat(temperaturaFormateada) // Convertir a número de nuevo
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("Alerta enviada con éxito:", data.message);
        setAlertStatus('Alerta enviada con éxito');
        
        // Guardamos el valor actual como el último valor de alerta
        setLastAlertValue(temp);
        
        // Establecemos un tiempo de espera para evitar el spam de alertas
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
        }, 10000); // 10 segundos de cooldown
        
      } else {
        console.error("Error en la respuesta del servidor:", data.message);
        setAlertStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error al enviar la alerta:", error);
      setAlertStatus(`Error de conexión: ${error.message}`);
    }
  };
  
  // Este manejador solo actualiza el input, no el valor de temperatura real
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Función para actualizar la temperatura cuando se presiona el botón
  const handleUpdateTemperature = () => {
    const newTemperatura = parseFloat(inputValue);
    
    // Verificar que es un número válido
    if (!isNaN(newTemperatura)) {
      setTemperatura(newTemperatura);
    } else {
      setAlertStatus('Por favor ingrese un número válido');
      setTimeout(() => setAlertStatus(''), 3000);
    }
  };
  
  useEffect(() => {
    // Solo enviar alerta si la temperatura es válida (no NaN)
    if (isNaN(temperatura)) return;
    
    // Verificamos si está fuera del rango permitido
    const fueraDeRango = temperatura < 22 || temperatura > 32;
    
    if (fueraDeRango) {
      // Verificamos si debemos enviar una nueva alerta
      const debeEnviarAlerta = 
        // No hay una alerta previa
        lastAlertValue === null || 
        // La temperatura ha cambiado significativamente (más de 1 grado)
        Math.abs(temperatura - lastAlertValue) >= 1 || 
        // La temperatura cruzó el umbral (de caliente a frío o viceversa)
        (lastAlertValue > 32 && temperatura < 22) || 
        (lastAlertValue < 22 && temperatura > 32);
      
      // Solo enviamos si debemos y no estamos en cooldown
      if (debeEnviarAlerta && !cooldown) {
        console.log("Enviando alerta por temperatura:", temperatura);
        enviar_temperatura_alert(temperatura);
      }
    } else {
      // Si volvió al rango normal, reiniciamos para que la próxima vez envíe alerta
      if (lastAlertValue !== null) {
        setLastAlertValue(null);
        setAlertStatus('Temperatura normalizada');
        
        // Después de 3 segundos, limpiamos el mensaje
        setTimeout(() => {
          if (temperatura >= 22 && temperatura <= 32) {
            setAlertStatus('');
          }
        }, 3000);
      }
    }
  }, [temperatura, lastAlertValue, cooldown]);
  
  // Actualizar el input cuando cambia la temperatura externa
  useEffect(() => {
    setInputValue(temperatura.toString());
  }, [temperatura]);
  
  // Determinar el estilo basado en el rango de temperatura
  const getTemperatureStyle = () => {
    if (temperatura > 32) return { color: 'red', fontWeight: 'bold' };
    if (temperatura < 22) return { color: 'blue', fontWeight: 'bold' };
    return { color: 'green' };
  };
  
  return (
    <div className="PruebasNotificaciones">
      <h2>Monitoreo De Temperatura</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <label htmlFor="temperatura">Temperatura (°C): </label>
        <input 
          id="temperatura"
          type="number" 
          value={inputValue} 
          onChange={handleInputChange} 
          step="0.1"
          style={{ width: '80px' }}
        />
        <button 
          onClick={handleUpdateTemperature}
          style={{
            padding: '5px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualizar
        </button>
      </div>
      
      <p>Temperatura actual: <span style={getTemperatureStyle()}>{temperatura.toFixed(2)}°C</span></p>
      
      {temperatura < 22 && 
        <p style={{color: 'blue'}}>
          ⚠️ Temperatura por debajo del rango normal (22°C - 32°C)
        </p>
      }
      {temperatura > 32 && 
        <p style={{color: 'red'}}>
          ⚠️ Temperatura por encima del rango normal (22°C - 32°C)
        </p>
      }
      
      {cooldown && 
        <p style={{color: 'gray'}}>
          ⏱️ Esperando para enviar la siguiente alerta...
        </p>
      }
      
      {alertStatus && <p className="alert-status">{alertStatus}</p>}
      
      {lastAlertValue !== null && (
        <div style={{marginTop: '10px', fontSize: '0.9em', color: '#555'}}>
          Última alerta enviada: {lastAlertValue.toFixed(2)}°C
        </div>
      )}
    </div>
  );
};

function PruebasNotificaciones() {
  const [temperatura, setTemperatura] = useState(25); // Valor inicial dentro del rango normal
  
  return (
    <div>
      <TemperaturaAlert temperatura={temperatura} setTemperatura={setTemperatura} />
    </div>
  );
}


export default PruebasNotificaciones;