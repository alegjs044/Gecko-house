import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
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
  overflow: auto;
  
  @media (max-width: 1200px) {
    width: 100%;
    max-width: 500px;
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
`;

const Td = styled.td`
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-size: 14px;
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

// Categorías disponibles para seleccionar
const categories = ['Temperatura', 'Iluminacion', 'Humedad'];

// Datos de ejemplo para Iluminación y Humedad (solo mantenemos estos, ya que Temperatura vendrá de la API)
const initialData = {
  Iluminacion: [
    { fecha: '01/02/2024', dato: '350 lux' },
    { fecha: '02/02/2024', dato: '340 lux' },
    // ...resto de datos de iluminación
    { fecha: '18/02/2024', dato: '430 lux' },
  ],
  Humedad: [
    { fecha: '01/02/2024', dato: '60%' },
    { fecha: '02/02/2024', dato: '58%' },
    // ...resto de datos de humedad
    { fecha: '18/02/2024', dato: '62%' },
  ],
};

// ----- FUNCIONES OPTIMIZADAS PARA MANEJO DE DATOS DE TEMPERATURA -----

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
  // CASO 1: Si es temperatura y tenemos datos reales de la API
  if (category === 'Temperatura' && Array.isArray(data) && data.length > 0) {
    // Tomar solo los últimos 6 registros (o menos si hay menos disponibles) y revertir para orden cronológico
    const lastSixData = data.slice(0, Math.min(6, data.length)).reverse();
    
    // Construir los datos para la gráfica
    return {
      // Etiquetas del eje X: horas de las mediciones
      labels: lastSixData.map(item => formatTimeForChart(item.Marca_tiempo)),
      
      // Conjunto de datos para dibujar
      datasets: [
        {
          label: category,
          // Convertimos las mediciones a números para la gráfica
          data: lastSixData.map(item => parseFloat(item.Medicion)),
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
      ]
    };
  } 
  // CASO 2: Para otras categorías (Iluminación y Humedad) usamos datos de ejemplo
  else {
    // Datos de ejemplo para gráficas de Humedad
    const fixedHumidityData = [
      { hora: '6 AM', valor: 60 },
      { hora: '9 AM', valor: 63 },
      { hora: '12 PM', valor: 67 },
      { hora: '3 PM', valor: 70 },
      { hora: '6 PM', valor: 65 },
      { hora: '9 PM', valor: 62 }
    ];
    
    // Datos de ejemplo para gráficas de Iluminación
    const fixedIlluminationData = [
      { hora: '6 AM', valor: 320 },
      { hora: '9 AM', valor: 380 },
      { hora: '12 PM', valor: 420 },
      { hora: '3 PM', valor: 430 },
      { hora: '6 PM', valor: 390 },
      { hora: '9 PM', valor: 350 }
    ];
    
    // Seleccionar el conjunto de datos según la categoría
    let dataToUse = category === 'Humedad' ? fixedHumidityData : fixedIlluminationData;
    
    // Devolver los datos formateados para Chart.js
    return {
      labels: dataToUse.map(item => item.hora),
      datasets: [
        {
          label: category,
          data: dataToUse.map(item => item.valor),
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
      ]
    };
  }
};

// Configuración de opciones para la gráfica
const getChartOptions = (category) => {
  // Determinar el rango según la categoría
  let min, max, stepSize;
  
  switch(category) {
    case 'Temperatura':
      // Valores ampliados para acomodar un rango más amplio de temperaturas
      min = 20.0;
      max = 35.0;
      stepSize = 2.5;
      break;
    case 'Humedad':
      min = 55;
      max = 75;
      stepSize = 5;
      break;
    case 'Iluminacion':
      min = 300;
      max = 450;
      stepSize = 50;
      break;
    default:
      min = null;
      max = null;
      stepSize = null;
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
              else if (category === 'Iluminacion') label += ' lux';
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
          }
        },
        title: {
          display: true,
          text: 'Tiempo',
          font: {
            size: 14
          }
        }
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: '#CCCCCC',
          drawBorder: true,
        },
        min: min,
        max: max,
        ticks: {
          stepSize: stepSize,
          font: {
            size: 12
          }
        },
        title: {
          display: true,
          text: category,
          font: {
            size: 14
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
        top: 5,
        right: 20,
        bottom: 20,
        left: 20
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

  // ----- OPTIMIZACIÓN 2: EFECTO PARA ACTUALIZAR DATOS SEGÚN CATEGORÍA -----
  useEffect(() => {
    // CASO: TEMPERATURA - Usar datos reales de la API
    if (selectedCategory === 'Temperatura') {
      // 1. Actualizar los datos de la tabla
      setFilteredData(temperatureData);
      
      // 2. Preparar datos para la gráfica
      if (temperatureData.length > 0) {
        // Extraer los datos originales desde los objetos 'raw'
        const rawTemperatureData = temperatureData.map(item => item.raw);
        
        // Generar datos para la gráfica pasando los datos originales
        setChartData(prepareChartData(rawTemperatureData, selectedCategory));
        
        // 3. Actualizar el valor actual (primer registro, el más reciente)
        setCurrentValue(temperatureData[0].dato);
      } else {
        // Si no hay datos, mostrar "--" como valor actual
        setCurrentValue("--");
      }
    } 
    // CASO: OTRAS CATEGORÍAS - Usar datos de ejemplo
    else {
      // 1. Actualizar los datos de la tabla
      setFilteredData(initialData[selectedCategory]);
      
      // 2. Preparar datos para la gráfica
      setChartData(prepareChartData(null, selectedCategory));
      
      // 3. Actualizar el valor actual
      const lastItem = initialData[selectedCategory][initialData[selectedCategory].length - 1];
      setCurrentValue(lastItem.dato);
    }
    
    // 4. Actualizar opciones de la gráfica según la categoría
    setChartOptions(getChartOptions(selectedCategory));
  }, [selectedCategory, temperatureData]); // Se ejecuta cuando cambia la categoría o los datos de temperatura

  // Manejador para el cambio de categoría en el selector
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Función para manejar el filtro de búsqueda
  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearch(query);
    
    // Filtrado diferente según la categoría seleccionada
    if (selectedCategory === 'Temperatura') {
      // Para temperatura, filtrar en datos reales de API
      const filtered = temperatureData.filter(
        (item) => 
          item.fecha.toLowerCase().includes(query) || 
          item.dato.toLowerCase().includes(query) ||
          (item.zona && item.zona.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    } else {
      // Para otras categorías, filtrar en datos de ejemplo
      const filtered = initialData[selectedCategory].filter(
        (item) => item.fecha.toLowerCase().includes(query) || item.dato.toLowerCase().includes(query)
      );
      setFilteredData(filtered);
    }
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