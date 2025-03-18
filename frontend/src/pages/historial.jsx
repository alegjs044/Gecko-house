import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Line } from "react-chartjs-2";
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { ArrowDown } from "lucide-react";
import { jsPDF } from "jspdf";

// Contenedor principal que alberga toda la interfaz
const Container = styled.div`
  padding: 50px 30px;
  margin: auto;
  max-width: 1400px;         /* Ancho máximo del contenedor - AJUSTABLE */
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 85vh;          /* Altura mínima - AJUSTABLE */
`;

// Componente para crear columnas flexibles
const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

// Componente base para crear filas flexibles
const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;             /* Padding de las filas - AJUSTABLE */
  margin: auto;
  width: 100%;
  border-radius: 25px;
`;

// Fila específica para los controles (selector y botón)
const ControlsRow = styled(Row)`
  background: transparent;
  justify-content: flex-start;
  gap: 15px;
  padding: 10px 20px;        /* Padding reducido - AJUSTABLE */
`;

// Fila para el contenido principal (tabla y gráfica)
const ContentRow = styled(Row)`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 30px;                 /* Espacio entre tabla y gráfica - AJUSTABLE */
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
`;

// Selector de categorías (Temperatura, Humedad, Iluminación)
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

// Contenedor para los botones de la derecha
const RightButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

// Botón rojo de búsqueda
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

// Botón para descargar la tabla de datos
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

// Panel para contener la tabla o la gráfica
const DataPanel = styled.div`
  background: rgba(123, 95, 61, 0.8);
  box-shadow: inset -5px -5px 10px rgba(238, 209, 146, 0.5), 
              10px 10px 20px rgba(245, 239, 230, 0.2);
  backdrop-filter: blur(10000px);
  filter: drop-shadow(5px 5px 10px rgba(248, 202, 132, 3));
  border: 1px solid rgba(248, 216, 186, 0.25);
  border-radius: 10px;
  padding: 15px;
  width: 47%;  /* Ligeramente reducido para asegurar que entren lado a lado */
  min-width: 300px;
  min-height: 450px;  /* Altura mínima para asegurar tamaños comparables */
  max-height: 500px;
  overflow: auto;
  
  @media (max-width: 1200px) {
    width: 100%;
    max-width: 500px;
  }
`;

// Estilo de la tabla
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 5px;
  overflow: hidden;
`;

// Estilo para las celdas de cabecera de la tabla
const Th = styled.th`
  background-color: #f0f0f0;
  color: #333;
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-size: 14px;
`;

// Estilo para las celdas de datos de la tabla
const Td = styled.td`
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-size: 14px;
`;

// Contenedor para la gráfica
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

// Estilo para mostrar el valor actual de la medición
const CurrentValue = styled.div`
  text-align: center;
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

// Título de la gráfica
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

// Contenedor del título
const ChartTitleContainer = styled.div`
  text-align: center;
  margin-bottom: 5px;
`;

// Título principal (no utilizado actualmente)
const Title = styled.h1`
  text-align: center;
  font-size: 2rem;           /* Tamaño de fuente - AJUSTABLE */
  margin-bottom: 20px;       /* Margen inferior - AJUSTABLE */
  color: #333;
`;

// Categorías disponibles para seleccionar
const categories = ['Temperatura', 'Iluminacion', 'Humedad'];

// Datos de ejemplo para cada categoría
const initialData = {
  Temperatura: [
    { fecha: '01/02/2024', dato: '29°C' },
    { fecha: '02/02/2024', dato: '30°C' },
    { fecha: '03/02/2024', dato: '30°C' },
    { fecha: '04/02/2024', dato: '31°C' },
    { fecha: '05/02/2024', dato: '31°C' },
    { fecha: '06/02/2024', dato: '31°C' },
    { fecha: '07/02/2024', dato: '31.5°C' },
    { fecha: '08/02/2024', dato: '31.5°C' },
    { fecha: '09/02/2024', dato: '31.5°C' },
    { fecha: '10/02/2024', dato: '32.5°C' },
    { fecha: '11/02/2024', dato: '32.5°C' },
    { fecha: '12/02/2024', dato: '32.5°C' },
    { fecha: '13/02/2024', dato: '32.5°C' },
    { fecha: '14/02/2024', dato: '33.5°C' },
    { fecha: '15/02/2024', dato: '33.5°C' },
    { fecha: '16/02/2024', dato: '33.5°C' },
    { fecha: '17/02/2024', dato: '33.5°C' },
    { fecha: '18/02/2024', dato: '34°C' },
  ],
  Iluminacion: [
    { fecha: '01/02/2024', dato: '350 lux' },
    { fecha: '02/02/2024', dato: '340 lux' },
    { fecha: '03/02/2024', dato: '360 lux' },
    { fecha: '04/02/2024', dato: '370 lux' },
    { fecha: '05/02/2024', dato: '380 lux' },
    { fecha: '06/02/2024', dato: '390 lux' },
    { fecha: '07/02/2024', dato: '400 lux' },
    { fecha: '08/02/2024', dato: '410 lux' },
    { fecha: '09/02/2024', dato: '420 lux' },
    { fecha: '10/02/2024', dato: '430 lux' },
    { fecha: '11/02/2024', dato: '440 lux' },
    { fecha: '12/02/2024', dato: '450 lux' },
    { fecha: '13/02/2024', dato: '430 lux' },
    { fecha: '14/02/2024', dato: '420 lux' },
    { fecha: '15/02/2024', dato: '410 lux' },
    { fecha: '16/02/2024', dato: '400 lux' },
    { fecha: '17/02/2024', dato: '420 lux' },
    { fecha: '18/02/2024', dato: '430 lux' },
  ],
  Humedad: [
    { fecha: '01/02/2024', dato: '60%' },
    { fecha: '02/02/2024', dato: '58%' },
    { fecha: '03/02/2024', dato: '62%' },
    { fecha: '04/02/2024', dato: '64%' },
    { fecha: '05/02/2024', dato: '63%' },
    { fecha: '06/02/2024', dato: '65%' },
    { fecha: '07/02/2024', dato: '67%' },
    { fecha: '08/02/2024', dato: '70%' },
    { fecha: '09/02/2024', dato: '68%' },
    { fecha: '10/02/2024', dato: '65%' },
    { fecha: '11/02/2024', dato: '63%' },
    { fecha: '12/02/2024', dato: '62%' },
    { fecha: '13/02/2024', dato: '60%' },
    { fecha: '14/02/2024', dato: '62%' },
    { fecha: '15/02/2024', dato: '64%' },
    { fecha: '16/02/2024', dato: '66%' },
    { fecha: '17/02/2024', dato: '63%' },
    { fecha: '18/02/2024', dato: '62%' },
  ],
};

/**
 * Prepara los datos para la gráfica Chart.js
 * @param {Array} data - Array de objetos con fecha y dato
 * @param {String} category - Categoría seleccionada
 * @returns {Object} Objeto formateado para Chart.js
 */
const prepareChartData = (data, category) => {
  // Usar datos de ejemplo fijos que corresponden a la imagen
  // Simulamos los datos de temperatura vistos en la imagen original
  const fixedTemperatureData = [
    { hora: '6 AM', valor: 27.0 },
    { hora: '9 AM', valor: 28.0 },
    { hora: '12 PM', valor: 29.0 },
    { hora: '3 PM', valor: 30.0 },
    { hora: '6 PM', valor: 29.0 },
    { hora: '9 PM', valor: 28.0 }
  ];
  
  // Simulamos datos para otras categorías
  const fixedHumidityData = [
    { hora: '6 AM', valor: 60 },
    { hora: '9 AM', valor: 63 },
    { hora: '12 PM', valor: 67 },
    { hora: '3 PM', valor: 70 },
    { hora: '6 PM', valor: 65 },
    { hora: '9 PM', valor: 62 }
  ];
  
  const fixedIlluminationData = [
    { hora: '6 AM', valor: 320 },
    { hora: '9 AM', valor: 380 },
    { hora: '12 PM', valor: 420 },
    { hora: '3 PM', valor: 430 },
    { hora: '6 PM', valor: 390 },
    { hora: '9 PM', valor: 350 }
  ];
  
  // Seleccionar el conjunto de datos según la categoría
  let dataToUse;
  if (category === 'Temperatura') {
    dataToUse = fixedTemperatureData;
  } else if (category === 'Humedad') {
    dataToUse = fixedHumidityData;
  } else {
    dataToUse = fixedIlluminationData;
  }
  
  // Preparar los datos para Chart.js
  const chartData = {
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
  
  return chartData;
};

// Opciones de configuración para la gráfica (MODIFICADAS)
const getChartOptions = (category) => {
  // Determinar el rango según la categoría
  let min, max, stepSize;
  
  switch(category) {
    case 'Temperatura':
      min = 27.0;
      max = 30.0;
      stepSize = 0.5;
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

  // Boton de busqueda (1)
  const [search, setSearch] = useState('');

  // Estado para la categoría seleccionada (Temperatura, Humedad, Iluminación)
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  
  // Estado para los datos filtrados según la categoría seleccionada
  const [filteredData, setFilteredData] = useState(initialData[selectedCategory]);
  
  // Estado para los datos de la gráfica
  const [chartData, setChartData] = useState(null);
  
  // Estado para el valor actual a mostrar prominentemente
  const [currentValue, setCurrentValue] = useState('');
  
  // Estado para las opciones de la gráfica
  const [chartOptions, setChartOptions] = useState(getChartOptions(categories[0]));
  
  // Unidades según la categoría seleccionada
  const unidades = {
    'Temperatura': '°C',
    'Humedad': '%',
    'Iluminacion': 'lux'
  };

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Efecto para actualizar los datos cuando cambia la categoría
  useEffect(() => {
    // Actualiza los datos de la tabla
    setFilteredData(initialData[selectedCategory]);
    
    // Prepara los datos para la gráfica
    setChartData(prepareChartData(initialData[selectedCategory], selectedCategory));
    
    // Actualiza las opciones de la gráfica según la categoría
    setChartOptions(getChartOptions(selectedCategory));
    
    // Obtiene el valor más reciente para mostrar
    const lastItem = initialData[selectedCategory][initialData[selectedCategory].length - 1];
    setCurrentValue(lastItem.dato);
  }, [selectedCategory]);

  // Manejador para el cambio de categoría
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Función para manejar el filtro de búsqueda
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearch(query);
    const filtered = initialData[selectedCategory].filter(
      (item) => item.fecha.includes(query) || item.dato.includes(query)
    );
    setFilteredData(filtered);
  };

  // Función para descargar la tabla como PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.text("Tabla de Datos", 20, y);
    y += 10;

    // Escribir los encabezados
    doc.text("Fecha", 20, y);
    doc.text("Dato", 80, y);
    y += 10;

    // Escribir los datos de la tabla
    filteredData.forEach(item => {
      doc.text(item.fecha, 20, y);
      doc.text(item.dato, 80, y);
      y += 10;
    });

  // Guardar como PDF
  doc.save('tabla_datos.pdf');
};

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

            {/* Boton busqueda */}

            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={handleSearchChange}
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
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <Td>{item.fecha}</Td>
                    <Td>{item.dato}</Td>
                  </tr>
                ))}
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