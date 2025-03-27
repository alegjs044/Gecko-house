import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { jsPDF } from "jspdf";
// Importamos axios para hacer peticiones HTTP a nuestra API
import axios from "axios";

// Estilos (se mantienen igual que el código original)
const Container = styled.div`
  padding: 50px 30px;
  margin: auto;
  max-width: 1400px;
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 85vh;
`;

// El resto de los componentes styled se mantienen igual
const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  margin: auto;
  width: 100%;
  border-radius: 25px;
`;

const ControlsRow = styled(Row)`
  background: transparent;
  justify-content: flex-start;
  gap: 15px;
  padding: 10px 20px;
`;

const ContentRow = styled(Row)`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 30px;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CategorySelect = styled.select`
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid #ddd;
  background-color: white;
  width: 300px;
  font-size: 16px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  
  &:focus {
    outline: none;
    border-color: #B4864D;
  }
`;

const RightButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const SearchButton = styled.button`
  background-color: #E74C3C;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 20px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  font-size: 14px;
  
  &:hover {
    background-color: #C0392B;
  }
`;

const DownloadButton = styled.button`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

// Actualizamos DataPanel para asegurar que el contenido se muestre pero con barras de desplazamiento
const DataPanel = styled.div`
  background: rgba(123, 95, 61, 0.8);
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), 
              10px 10px 20px rgba(245, 239, 230, 0.2);
  backdrop-filter: blur(10000px);
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3));
  border: 1px solid rgba(248, 216, 186, 0.25);
  border-radius: 10px;
  padding: 15px;
  width: 47%;
  min-width: 300px;
  min-height: 450px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1200px) {
    width: 100%;
    max-width: 500px;
  }
`;

// Componente mejorado para la tabla con barra de desplazamiento
const TableWrapper = styled.div`
  width: 100%;
  height: 100%;
  max-height: 420px;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: 5px;
  
  /* Estilos para la barra de desplazamiento vertical */
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #B4864D;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #7B5F3D;
  }
  
  /* Estilos para la barra de desplazamiento horizontal */
  &::-webkit-scrollbar-corner {
    background: #f1f1f1;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 5px;
  overflow: hidden;
`;

const Th = styled.th`
  background-color: #f0f0f0;
  color: #333;
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Td = styled.td`
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-size: 14px;
`;

// Componente para la gráfica con barras de desplazamiento
const ChartScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  border-radius: 8px;
  
  /* Estilos para la barra de desplazamiento */
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #B4864D;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #7B5F3D;
  }
  
  &::-webkit-scrollbar-corner {
    background: #f1f1f1;
  }
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
`;

const ChartInnerContainer = styled.div`
  min-width: 500px; /* Asegura que la gráfica tenga un ancho mínimo */
  min-height: 300px; /* Asegura que la gráfica tenga una altura mínima */
  height: 100%;
  width: 100%;
  flex-grow: 1;
`;

const CurrentValue = styled.div`
  text-align: center;
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ChartTitle = styled.h3`
  text-align: center;
  background-color: #FF8C00;
  color: white;
  padding: 5px 15px;
  border-radius: 4px;
  margin: 0 auto 10px;
  font-size: 16px;
  display: inline-block;
`;

const ChartTitleContainer = styled.div`
  text-align: center;
  margin-bottom: 5px;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
`;

// Categorías disponibles para seleccionar (Iluminacion ahora se llama Iluminacion UV para mayor claridad)
const categories = ['Temperatura', 'Iluminacion UV', 'Humedad'];

/**
 * Formatea una fecha ISO de la base de datos a formato de visualización DD/MM/YYYY
 * @param {String} dateTimeString - Fecha en formato ISO (ej: 2025-03-20T14:30:00)
 * @returns {String} - Fecha formateada (ej: 20/03/2025)
 */
const formatDate = (dateTimeString) => {
  // Crear un objeto Date a partir del string de fecha
  const date = new Date(dateTimeString);
  // Formatear la fecha como DD/MM/YYYY con padding de ceros (01/01/2025 en lugar de 1/1/2025)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

/**
 * Formatea la hora de un timestamp para mostrarla en la gráfica
 * @param {String} dateTimeString - Fecha y hora en formato ISO
 * @returns {String} - Hora formateada (ej: 14:30)
 */
const formatTimeForChart = (dateTimeString) => {
  // Crear un objeto Date a partir del string de fecha y hora
  const date = new Date(dateTimeString);
  // Devolver solo la hora y minutos formateados como HH:MM
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Prepara los datos para la gráfica Chart.js
 * @param {Array} data - Array de objetos con datos
 * @param {String} category - Categoría seleccionada
 * @returns {Object} Objeto formateado para Chart.js
 */
const prepareChartData = (data, category) => {
  // Si tenemos datos reales de la API para cualquiera de las categorías
  if (Array.isArray(data) && data.length > 0) {
    // Tomar solo los últimos 6 registros (o menos si hay menos disponibles) y revertir para orden cronológico
    const lastSixData = data.slice(0, Math.min(6, data.length)).reverse();
    
    // Extraer valores numéricos para calcular min/max
    const numericValues = lastSixData.map(item => parseFloat(item.Medicion));
    
    // Calcular valor mínimo y máximo para el auto-ajuste
    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    
    // Construir los datos para la gráfica
    return {
      // Etiquetas del eje X: horas de las mediciones
      labels: lastSixData.map(item => formatTimeForChart(item.Marca_tiempo)),
      
      // Conjunto de datos para dibujar
      datasets: [
        {
          label: category,
          // Convertimos las mediciones a números para la gráfica
          data: numericValues,
          // Configuración visual de la línea
          fill: false,
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          borderColor: '#FFA500',
          borderWidth: 3,
          tension: 0.3,
          pointBackgroundColor: '#FFA500',
          pointBorderColor: '#FFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ],
      // Añadir propiedades para almacenar valores min/max
      _minValue: minValue,
      _maxValue: maxValue
    };
  } else {
    // Si no hay datos, devolver un objeto con datos vacíos pero estructura válida
    return {
      labels: [],
      datasets: [
        {
          label: category,
          data: [],
          fill: false,
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          borderColor: '#FFA500',
          borderWidth: 3,
          tension: 0.3,
        }
      ],
      _minValue: 0,
      _maxValue: 100
    };
  }
};

/**
 * Obtiene opciones de configuración para la gráfica adaptadas a los datos
 * @param {String} category - Categoría seleccionada
 * @param {Object} chartData - Datos de la gráfica que contienen _minValue y _maxValue
 * @returns {Object} Opciones de configuración para Chart.js
 */

const getChartOptions = (category, chartData) => {
  // Determinar el rango según la categoría y los datos
  let minY, maxY, stepSizeY;
  
  // Para auto-ajuste del eje X (tiempo), necesitaremos detectar el rango de tiempo
  let minTime = null, maxTime = null;
  
  // Si tenemos datos válidos con valores min/max
  if (chartData && chartData._minValue !== undefined && chartData._maxValue !== undefined) {
    // Calcular margen de 20% para que los puntos no queden pegados a los bordes
    const rangeY = chartData._maxValue - chartData._minValue;
    const paddingY = Math.max(rangeY * 0.2, 2); // Al menos 2 unidades de padding
    
    minY = Math.floor(chartData._minValue - paddingY);
    maxY = Math.ceil(chartData._maxValue + paddingY);
    
    // Asegurar que min y max sean diferentes para evitar errores en la gráfica
    if (minY === maxY) {
      minY = minY - 5; // Aumentado para dar más espacio
      maxY = maxY + 5; // Aumentado para dar más espacio
    }
    
    // Calcular un tamaño de paso razonable
    const stepsY = 4; // Ajustamos para tener menos líneas de cuadrícula
    stepSizeY = Math.ceil((maxY - minY) / stepsY);
    
    // Auto-ajuste del eje X (tiempo)
    if (chartData.labels && chartData.labels.length > 0) {
      // Calculamos un margen adicional para el eje X
      minTime = -0.5; // Margen izquierdo
      maxTime = chartData.labels.length - 0.5; // Margen derecho
    }
  } else {
    // Valores por defecto si no hay datos
    switch(category) {
      case 'Temperatura':
        minY = 15.0;
        maxY = 40.0;
        stepSizeY = 5;
        break;
      case 'Humedad':
        minY = 45;
        maxY = 85;
        stepSizeY = 10;
        break;
      case 'Iluminacion UV':
        minY = 0;
        maxY = 600;
        stepSizeY = 100;
        break;
      default:
        minY = 0;
        maxY = 100;
        stepSizeY = 20;
    }
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              // Añadir unidad según la categoría
              if (category === 'Temperatura') label += '°C';
              else if (category === 'Humedad') label += '%';
              else if (category === 'Iluminacion UV') label += ' lux';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: '#CCCCCC',
          drawBorder: true,
        },
        ticks: {
          font: {
            size: 12
          },
          // Asegurar que todas las etiquetas sean visibles
          autoSkip: false,
          // Rotar etiquetas si hay muchas
          maxRotation: 45,
          minRotation: 0
        },
        title: {
          display: true,
          text: 'Tiempo',
          font: {
            size: 14
          },
          padding: {
            top: 10
          }
        },
        // Añadir espacio en los extremos del eje X para mejorar la visualización
        min: minTime,
        max: maxTime,
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: '#CCCCCC',
          drawBorder: true,
        },
        min: minY,
        max: maxY,
        ticks: {
          stepSize: stepSizeY,
          font: {
            size: 12
          },
          // Utilizar callback para formato personalizado
          callback: function(value) {
            // Evitar demasiados decimales
            return Number.isInteger(value) ? value : value.toFixed(1);
          }
        },
        title: {
          display: true,
          text: category,
          font: {
            size: 14
          },
          padding: {
            bottom: 10
          }
        }
      }
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 7,
        borderWidth: 2
      },
      line: {
        tension: 0.3,
        borderWidth: 3,
      }
    },
    layout: {
      padding: {
        top: 20,
        right: 30,
        bottom: 30,
        left: 30
      }
    }
  };
};

/**
 * Componente principal para la visualización del historial de datos
 */
function Historial() {
  // Estado para la búsqueda
  const [search, setSearch] = useState('');

  // Estado para la categoría seleccionada (por defecto 'Temperatura')
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  
  // Estado para almacenar los datos de temperatura cargados desde la API
  const [temperatureData, setTemperatureData] = useState([]);

  // Estado para almacenar los datos de humedad cargados desde la API
  const [humidityData, setHumidityData] = useState([]);

   // Estado para almacenar los datos de iluminación UV cargados desde la API 
   const [illuminationData, setIlluminationData] = useState([]);
  
  // Estado para los datos filtrados según búsqueda y categoría
  const [filteredData, setFilteredData] = useState([]);
  
  // Estado para los datos procesados para la gráfica
  const [chartData, setChartData] = useState(null);
  
  // Estado para el valor actual a mostrar prominentemente
  const [currentValue, setCurrentValue] = useState('');
  
  // Estado para las opciones de configuración de la gráfica
  const [chartOptions, setChartOptions] = useState(getChartOptions(categories[0]));
  
  // Estado para controlar errores de carga
  const [error, setError] = useState(null);
  
  // Estado para controlar indicador de carga
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // ----- OPTIMIZACIÓN 1: EFECTO PARA CARGAR DATOS DE TEMPERATURA -----
  useEffect(() => {
    // Función asíncrona para obtener datos de la API
    const fetchTemperatureData = async () => {
      try {
        // 1. Indicar que estamos cargando datos
        setLoading(true);
        
        // 2. Realizar la petición GET a la API
        const response = await axios.get('http://localhost:5000/api/temperatura');
        
        // 3. Verificar si hay datos en la respuesta
        if (response.data && response.data.length > 0) {
          // 4. Procesar los datos recibidos para adaptarlos al formato esperado
          const formattedData = response.data.map(item => ({
            fecha: formatDate(item.Marca_tiempo),  // Formateamos fecha para visualización
            dato: `${item.Medicion}°C`,            // Agregamos unidad a la medición
            zona: item.Zona,                       // Guardamos la zona de la temperatura
            raw: item                              // Guardamos el objeto original para acceso a datos crudos
          }));
          
          // 5. Actualizar el estado con los datos formateados
          setTemperatureData(formattedData);
        } else {
          // 6. Si no hay datos, establecer un array vacío
          setTemperatureData([]);
        }
        
        // 7. Finalizar el estado de carga
        setLoading(false);
      } catch (err) {
        // 8. Manejar errores de la petición
        console.error("Error al cargar datos de temperatura:", err);
        setError("Error al cargar datos de temperatura. Por favor, intente de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    // Ejecutar la función de carga
    fetchTemperatureData();
  }, []); // Se ejecuta solo al montar el componente

  // ----- EFECTO PARA CARGAR DATOS DE HUMEDAD -----
  useEffect(() => {
    // Función asíncrona para obtener datos de humedad
    const fetchHumidityData = async () => {
      try {
        // Realizar la petición GET a la API
        const response = await axios.get('http://localhost:5000/api/humedad');
        
        // Verificar si hay datos en la respuesta
        if (response.data && response.data.length > 0) {
          // Procesar los datos recibidos para adaptarlos al formato esperado
          const formattedData = response.data.map(item => ({
            fecha: formatDate(item.Marca_tiempo),  // Formateamos fecha para visualización
            dato: `${item.Medicion}%`,             // Agregamos unidad a la medición
            raw: item                              // Guardamos el objeto original para acceso a datos crudos
          }));
          
          // Actualizar el estado con los datos formateados
          setHumidityData(formattedData);
        } else {
          // Si no hay datos, establecer un array vacío
          setHumidityData([]);
        }
        
        // Finalizar el estado de carga
        setLoading(false);
      } catch (err) {
        // Manejar errores de la petición
        console.error("Error al cargar datos de humedad:", err);
        setError("Error al cargar datos de humedad. Por favor, intente de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    // Ejecutar la función de carga
    fetchHumidityData();
  }, []); // Se ejecuta solo al montar el componente

  // ----- EFECTO PARA CARGAR DATOS DE ILUMINACIÓN UV -----
  useEffect(() => {
    // Función asíncrona para obtener datos de iluminación
    const fetchIlluminationData = async () => {
      try {
        // Realizar la petición GET a la API
        const response = await axios.get('http://localhost:5000/api/iluminacion');
        
        // Verificar si hay datos en la respuesta
        if (response.data && response.data.length > 0) {
          // Procesar los datos recibidos para adaptarlos al formato esperado
          const formattedData = response.data.map(item => ({
            fecha: formatDate(item.Marca_tiempo),  // Formateamos fecha para visualización
            dato: `${item.Medicion} lux`,          // Agregamos unidad a la medición
            raw: item                              // Guardamos el objeto original para acceso a datos crudos
          }));
          
          // Actualizar el estado con los datos formateados
          setIlluminationData(formattedData);
        } else {
          // Si no hay datos, establecer un array vacío
          setIlluminationData([]);
        }

        // Finalizar el estado de carga después de cargar todos los datos
        setLoading(false);
      } catch (err) {
        // Manejar errores de la petición
        console.error("Error al cargar datos de iluminación:", err);
        setError("Error al cargar datos de iluminación. Por favor, intente de nuevo más tarde.");
        setLoading(false);
      }
    };
    
    // Ejecutar la función de carga
    fetchIlluminationData();
  }, []); // Se ejecuta solo al montar el componente

  
  // ----- EFECTO PARA ACTUALIZAR DATOS SEGÚN CATEGORÍA -----
  useEffect(() => {
    // Seleccionar datos según la categoría
    switch(selectedCategory) {
      case 'Temperatura':
        // Actualizar los datos de la tabla
        setFilteredData(temperatureData);
        
        // Preparar datos para la gráfica
        if (temperatureData.length > 0) {
          // Extraer los datos originales desde los objetos 'raw'
          const rawData = temperatureData.map(item => item.raw);
          
          // Generar datos para la gráfica
          const preparedChartData = prepareChartData(rawData, selectedCategory);
          setChartData(preparedChartData);
          
          // Actualizar opciones de la gráfica según los datos
          setChartOptions(getChartOptions(selectedCategory, preparedChartData));
          
          // Actualizar el valor actual (primer registro, el más reciente)
          setCurrentValue(temperatureData[0].dato);
        } else {
          // Si no hay datos, mostrar "--" como valor actual
          setCurrentValue("--");
          const emptyData = prepareChartData([], selectedCategory);
          setChartData(emptyData);
          setChartOptions(getChartOptions(selectedCategory, emptyData));
        }
        break;
        
      case 'Humedad':
        // Actualizar los datos de la tabla
        setFilteredData(humidityData);
        
        // Preparar datos para la gráfica
        if (humidityData.length > 0) {
          // Extraer los datos originales
          const rawData = humidityData.map(item => item.raw);
          
          // Generar datos para la gráfica
          const preparedChartData = prepareChartData(rawData, selectedCategory);
          setChartData(preparedChartData);
          
          // Actualizar opciones de la gráfica según los datos
          setChartOptions(getChartOptions(selectedCategory, preparedChartData));
          
          // Actualizar valor actual
          setCurrentValue(humidityData[0].dato);
        } else {
          setCurrentValue("--");
          const emptyData = prepareChartData([], selectedCategory);
          setChartData(emptyData);
          setChartOptions(getChartOptions(selectedCategory, emptyData));
        }
        break;
        
      case 'Iluminacion UV':
        // Actualizar los datos de la tabla
        setFilteredData(illuminationData);
        
        // Preparar datos para la gráfica
        if (illuminationData.length > 0) {
          // Extraer los datos originales
          const rawData = illuminationData.map(item => item.raw);
          
          // Generar datos para la gráfica
          const preparedChartData = prepareChartData(rawData, selectedCategory);
          setChartData(preparedChartData);
          
          // Actualizar opciones de la gráfica según los datos
          setChartOptions(getChartOptions(selectedCategory, preparedChartData));
          
          // Actualizar valor actual
          setCurrentValue(illuminationData[0].dato);
        } else {
          setCurrentValue("--");
          const emptyData = prepareChartData([], selectedCategory);
          setChartData(emptyData);
          setChartOptions(getChartOptions(selectedCategory, emptyData));
        }
        break;
        
      default:
        break;
    }
  }, [selectedCategory, temperatureData, humidityData, illuminationData]); // Se ejecuta cuando cambia la categoría o los datos

  // Manejador para el cambio de categoría en el selector
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Función para manejar el filtro de búsqueda
  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearch(query);
    
    // Obtener el conjunto de datos correspondiente a la categoría seleccionada
    let dataToFilter;
    switch(selectedCategory) {
      case 'Temperatura':
        dataToFilter = temperatureData;
        break;
      case 'Humedad':
        dataToFilter = humidityData;
        break;
      case 'Iluminacion UV':
        dataToFilter = illuminationData;
        break;
      default:
        dataToFilter = [];
    }
    
    // Filtrar los datos según la consulta
    const filtered = dataToFilter.filter(
      (item) => 
        item.fecha.toLowerCase().includes(query) || 
        item.dato.toLowerCase().includes(query) ||
        (item.zona && item.zona.toLowerCase().includes(query))
    );
    
    setFilteredData(filtered);
  };

  // Función para descargar la tabla como PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.text(`Tabla de Datos - ${selectedCategory}`, 20, y);
    y += 10;

    // Escribir los encabezados
    doc.text("Fecha", 20, y);
    doc.text("Dato", 80, y);
    // Agregar columna de zona solo para temperatura
    if (selectedCategory === 'Temperatura') {
      doc.text("Zona", 140, y);
    }
    y += 10;

    // Escribir los datos de la tabla
    filteredData.forEach(item => {
      doc.text(item.fecha, 20, y);
      doc.text(item.dato, 80, y);
      if (selectedCategory === 'Temperatura' && item.zona) {
        doc.text(item.zona, 140, y);
      }
      y += 10;
      
      // Si llegamos al final de la página, crear una nueva
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    // Guardar como PDF
    doc.save(`tabla_${selectedCategory.toLowerCase()}.pdf`);
  };

  // Renderizar mensaje de carga o error si es necesario
  if (loading) {
    return (
      <>
        <Header showUserIcon={true} />
        <Container>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Cargando datos...
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header showUserIcon={true} />
        <Container>
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            {error}
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* Cabecera de la aplicación */}
      <Header showUserIcon={true} />
      
      {/* Contenedor principal */}
      <Container>
        {/* Título */}
        <h1 style={{ textAlign: 'center', margin: '10px 0 30px' }}> </h1>
        
        {/* Fila de controles: selector de categoría y botones */}
        <ControlsRow>
          <CategorySelect onChange={handleCategoryChange} value={selectedCategory}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </CategorySelect>
  
          <RightButtonsContainer>
            {/* Botón búsqueda */}
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={handleSearchChange}
              style={{
                padding: '8px 10px',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}
            />

            <DownloadButton onClick={downloadPDF}>
              <ArrowDown size={24} />
            </DownloadButton>
          </RightButtonsContainer>
        </ControlsRow>
        
        {/* Fila de contenido: tabla y gráfica */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '30px', width: '100%' }}>
          {/* Panel izquierdo: Tabla de datos históricos */}
          <DataPanel>
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Dato</Th>
                  {/* Mostrar columna Zona solo para Temperatura */}
                  {selectedCategory === 'Temperatura' && <Th>Zona</Th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={index}>
                      <Td>{item.fecha}</Td>
                      <Td>{item.dato}</Td>
                      {selectedCategory === 'Temperatura' && <Td>{item.zona || '-'}</Td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={selectedCategory === 'Temperatura' ? 3 : 2} style={{textAlign: 'center'}}>
                      No hay datos disponibles
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </DataPanel>
          
          {/* Panel derecho: Gráfica y valor actual */}
          <DataPanel>
            <ChartContainer>
              {/* Título de la gráfica (categoría seleccionada) */}
              <ChartTitleContainer>
                <ChartTitle>{selectedCategory}</ChartTitle>
              </ChartTitleContainer>
              
              {/* Valor actual */}
              <CurrentValue>{currentValue}</CurrentValue>
              
              {/* Contenedor para la gráfica con espacio suficiente para ejes y etiquetas */}
              <div style={{ height: '250px', width: '100%', flexGrow: 1 }}>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </ChartContainer>
          </DataPanel>
        </div>
      </Container>
      
      {/* Pie de página */}
      <Footer />
    </>
  );
}

export default Historial;