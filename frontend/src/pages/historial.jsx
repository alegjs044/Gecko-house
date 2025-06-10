import React, { useState, useEffect } from "react"; 
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/Loading";
import {
  PageContainer, Container, InfoBanner, InfoTitle, InfoSubtitle, ControlsRow, SelectGroup,
  CategorySelect, SearchInput, ButtonsContainer, DownloadButton, DeleteButton,
  ActionButtonsContainer, SelectionText, ContentRow, DataPanel, Table, Th, Td,
  CheckboxTd, Checkbox, CriticalTd, NormalTd, CycleTd, TableCycleIndicator,
  ChartContainer, ChartTitleContainer, ChartTitle, CurrentValue, Pagination,
  PaginationButton, PaginationText, ChartWrapper, CycleInfo, CycleIndicator
} from "../styles/historialStyles";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ITEMS_PER_PAGE = 10;
const API_BASE_URL = "http://localhost:5004/api";
const AUTO_REFRESH_INTERVAL = 30000;

// ============================================
// COMPONENTE MODAL DE BÚSQUEDA
// ============================================
const SearchModal = ({ show, onClose, searchTerm, resultsCount }) => {
  if (!show) return null;
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '30px', borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)', maxWidth: '400px',
        width: '90%', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
        <h2 style={{ color: '#2ecc71', marginBottom: '15px', fontSize: '24px' }}>
          ¡Búsqueda Exitosa!
        </h2>
        <p style={{ marginBottom: '10px', fontSize: '16px', color: '#555' }}>
          Término buscado: <strong>"{searchTerm}"</strong>
        </p>
        <p style={{ marginBottom: '25px', fontSize: '16px', color: '#555' }}>
          Se encontraron <strong>{resultsCount}</strong> registro(s) que coinciden.
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#3498db', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '5px', fontSize: '16px',
            cursor: 'pointer', transition: 'background-color 0.3s'
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    return null;
  }
};

const formatDate = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
};

const formatTime = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const formatDateTime = (dateTime) => `${formatDate(dateTime)} ${formatTime(dateTime)}`;

// 🔧 CAMBIADO: Sin redondeo, mostrando 2 decimales
const formatValue = (value, category) => {
  if (value === null || value === undefined) return "--";
  const preciseValue = parseFloat(value).toFixed(2); // 🔧 2 decimales en lugar de redondeo
  return {
    temperatura: `${preciseValue}°C`,
    humedad: `${preciseValue}%`,
    luz_uv: preciseValue
  }[category] || preciseValue;
};

const getCycleText = (ciclo) => ({ 
  dia: "Día", 
  noche: "Noche", 
  diaam: "Amanecer" 
}[ciclo] || ciclo);

const getCycleIcon = (ciclo) => ({ 
  dia: "☀️", 
  noche: "🌙", 
  diaam: "🌅" 
}[ciclo] || "⚡");

const getZoneText = (zona) => {
  if (!zona) return "-";
  const zoneLower = zona.toLowerCase();
  if (zoneLower === "fria" || zoneLower === "fría") return "Fría";
  if (zoneLower === "caliente") return "Caliente";
  return zona;
};

const getCategoryTitle = (cat) => ({ 
  temperatura: "Temperatura", 
  humedad: "Humedad", 
  luz_uv: "Luz UV" 
}[cat] || cat.charAt(0).toUpperCase() + cat.slice(1));

const getChartColors = (category) => ({
  temperatura: { fria: "#3498db", caliente: "#e67e22" },
  humedad: "#27ae60",
  luz_uv: "#8e44ad"
}[category] || "#ff8c00");

const isInMudaState = (estadoMuda) => estadoMuda === true || estadoMuda === 1;

// Escalas fijas para evitar picos visuales exagerados
const getFixedYAxisRange = (category, filterZone = null) => {
  if (category === "temperatura") {
    if (filterZone === "fria") return { min: 18, max: 32 };
    if (filterZone === "caliente") return { min: 25, max: 40 };
    return { min: 18, max: 40 };
  }
  if (category === "humedad") return { min: 30, max: 80 };
  if (category === "luz_uv") return { min: 0, max: 2 };
  return { min: undefined, max: undefined };
};

// 🔧 CAMBIADO: Suavizado sin redondeo, mantiene precisión
const smoothForStraightLines = (data, threshold = 0.8) => {
  if (data.length <= 2) return data;
  
  const smoothed = [parseFloat(data[0])]; // 🔧 Sin redondeo
  
  for (let i = 1; i < data.length; i++) {
    const current = parseFloat(data[i]); // 🔧 Sin redondeo
    const previous = smoothed[smoothed.length - 1];
    
    if (Math.abs(current - previous) < threshold) {
      smoothed.push(previous); 
    } else {
      smoothed.push(current);
    }
  }
  
  return smoothed;
};

const Historial = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalLoading, setInternalLoading] = useState(false);
  const [limitesSistema, setLimitesSistema] = useState(null);
  const [cicloActual, setCicloActual] = useState('');
  const [estadoMudaActual, setEstadoMudaActual] = useState(null);
  
  // 🔧 NUEVO: Estados de búsqueda
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const [category, setCategory] = useState("temperatura");
  const [filterDate, setFilterDate] = useState("all");
  const [filterType, setFilterType] = useState("todos");
  const [filterZone, setFilterZone] = useState("todas");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  
  const [maxRegistrosGrafico, setMaxRegistrosGrafico] = useState(50);
  const [inputRegistrosGrafico, setInputRegistrosGrafico] = useState('50');
  const [mostrarTodosEnGrafico, setMostrarTodosEnGrafico] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    let ignore = false;
    
    const fetchAll = async () => {
      if (!ignore) setLoading(true);
      
      try {
        const userData = getUserData();
        if (!userData?.ID_usuario) {
          navigate('/login');
          return;
        }
        
        const [historialRes, limitesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/historial/${category}?ID_usuario=${userData.ID_usuario}`),
          fetch(`${API_BASE_URL}/limites`)
        ]);
        
        if (!historialRes.ok) throw new Error(`HTTP error! status: ${historialRes.status}`);
        
        const historialData = await historialRes.json();
        
        if (!ignore) {
          setData(Array.isArray(historialData) ? historialData : []);
          setSelectedItems(new Set());
          
          if (limitesRes.ok) {
            const limitesData = await limitesRes.json();
            setLimitesSistema(limitesData);
            setCicloActual(limitesData.ciclo || 'dia');
            setEstadoMudaActual(limitesData.estado_muda);
          }
        }
        
      } catch (error) {
        console.error("Error cargando datos:", error);
        if (!ignore) setData([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAll();
    return () => { ignore = true; };
  }, [category, navigate]);

  // Auto-refresh silencioso
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        setInternalLoading(true);
        const userData = getUserData();
        if (!userData?.ID_usuario) return;
        
        const [historialRes, limitesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/historial/${category}?ID_usuario=${userData.ID_usuario}`),
          fetch(`${API_BASE_URL}/limites`)
        ]);
        
        if (historialRes.ok) {
          const historialData = await historialRes.json();
          setData(Array.isArray(historialData) ? historialData : []);
        }
        
        if (limitesRes.ok) {
          const limitesData = await limitesRes.json();
          setLimitesSistema(limitesData);
          setCicloActual(limitesData.ciclo || 'dia');
          setEstadoMudaActual(limitesData.estado_muda);
        }
        
      } catch (error) {
        console.error("Error en auto-refresh:", error);
      } finally {
        setInternalLoading(false);
      }
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [category]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchInput("");
    setActiveSearch("");
    setFilterZone("todas");
  }, [category]);

  // 🔧 NUEVO: Función de búsqueda
  const handleSearchClick = () => {
    if (!searchInput.trim()) {
      alert("Por favor ingresa un término de búsqueda");
      return;
    }
    
    setActiveSearch(searchInput.trim());
    setCurrentPage(1);
    setShowSearchModal(true);
  };

  // 🔧 NUEVO: Limpiar búsqueda
  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  // 🔧 CORREGIDO: Eliminación de registros con validación de usuario
  const deleteSelectedRecords = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedItems.size} registro(s)?`)) return;
    
    setDeleting(true);
    try {
      const userData = getUserData();
      const token = localStorage.getItem('token');
      
      if (!userData?.ID_usuario) {
        alert('Error: No se encontraron datos del usuario. Inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      
      if (!token) {
        alert('Error: Token de sesión no encontrado. Inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      
      console.log('Eliminando registros:', {
        category,
        ids: Array.from(selectedItems),
        userId: userData.ID_usuario,
        recordCount: selectedItems.size
      });
      
      // Preparar el cuerpo de la petición con formato correcto
      const requestBody = {
        ID_usuario: parseInt(userData.ID_usuario), // Asegurar que sea número
        ids: Array.from(selectedItems).map(id => parseInt(id)), // Asegurar que los IDs sean números
        categoria: category // Incluir categoría por si el backend la necesita
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/historial/${category}/registros`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Manejar respuesta del servidor
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        // Manejo específico de errores
        if (response.status === 400) {
          throw new Error(`Error de validación: ${responseData.error || responseData.message || 'Datos inválidos'}`);
        } else if (response.status === 401) {
          throw new Error('Sesión expirada. Inicia sesión nuevamente.');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar estos registros.');
        } else if (response.status === 404) {
          throw new Error('Los registros no fueron encontrados o ya fueron eliminados.');
        } else {
          throw new Error(`Error del servidor (${response.status}): ${responseData.error || responseData.message || 'Error desconocido'}`);
        }
      }
      
      // Éxito en la eliminación
      const deletedCount = responseData.deletedCount || responseData.affected || selectedItems.size;
      
      setSelectedItems(new Set());
      alert(`${deletedCount} registro(s) eliminado(s) exitosamente.`);
      console.log(`✅ Eliminación exitosa: ${deletedCount} registros`);
      
      // Recargar datos después de eliminar
      console.log('Recargando datos después de eliminación...');
      const reloadUserData = getUserData();
      if (reloadUserData?.ID_usuario) {
        const historialRes = await fetch(`${API_BASE_URL}/historial/${category}?ID_usuario=${reloadUserData.ID_usuario}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (historialRes.ok) {
          const historialData = await historialRes.json();
          setData(Array.isArray(historialData) ? historialData : []);
          console.log('✅ Datos recargados correctamente');
        } else {
          console.warn('⚠️ Error recargando datos:', historialRes.status);
        }
      }
      
    } catch (error) {
      console.error('❌ Error eliminando registros:', error);
      
      // Manejo específico para errores de sesión
      if (error.message.includes('Sesión expirada') || error.message.includes('Token')) {
        alert('Tu sesión ha expirado. Serás redirigido al login.');
        navigate('/login');
        return;
      }
      
      alert(`Error al eliminar los registros: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // 🔧 MODIFICADO: Aplicar filtros incluyendo búsqueda
  const applyFilters = (list) => {
    let filtered = list;
    
    // 🔧 NUEVO: Filtro de búsqueda
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      filtered = filtered.filter(item =>
        formatDate(item.marca_tiempo).toLowerCase().includes(searchLower) ||
        item.medicion.toString().toLowerCase().includes(searchLower) ||
        (item.zona?.toLowerCase() || "").includes(searchLower) ||
        (item.ciclo?.toLowerCase() || "").includes(searchLower)
      );
    }
    
    if (filterDate !== "all") {
      const now = new Date();
      const daysAgo = { today: 0, last3days: 3, last7days: 7 }[filterDate] || 0;
      const limitDate = new Date();
      limitDate.setDate(now.getDate() - daysAgo);
      filtered = filtered.filter(item => new Date(item.marca_tiempo) >= limitDate);
    }
    
    if (filterType !== "todos") {
      filtered = filtered.filter(item => 
        filterType === "criticos" ? item.es_critico === true : item.es_critico === false
      );
    }
    
    if (category === "temperatura" && filterZone !== "todas") {
      filtered = filtered.filter(item => {
        const zona = item.zona?.toLowerCase();
        if (filterZone === "fria") return zona === "fria" || zona === "fría";
        if (filterZone === "caliente") return zona === "caliente";
        return true;
      });
    }
    
    return filtered;
  };

  const filtered = applyFilters(data);
  
  const getDataForChart = () => {
    if (mostrarTodosEnGrafico) return filtered;
    const sortedData = [...filtered].sort((a, b) => new Date(b.marca_tiempo) - new Date(a.marca_tiempo));
    return sortedData.slice(0, maxRegistrosGrafico);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const allFilteredSelected = filtered.length > 0 && filtered.every(item => selectedItems.has(item.id));

  const handleCheckboxChange = (itemId, isChecked) => {
    const newSelected = new Set(selectedItems);
    if (isChecked) newSelected.add(itemId);
    else newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const handleSelectAllRecords = (isChecked) => {
    setSelectedItems(isChecked ? new Set(filtered.map(item => item.id)) : new Set());
  };

  const handleInputRegistrosChange = (e) => {
    const value = e.target.value;
    setInputRegistrosGrafico(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 1000) {
      setMaxRegistrosGrafico(numValue);
    }
  };

  const handleMostrarTodosChange = (e) => {
    setMostrarTodosEnGrafico(e.target.checked);
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;
      
      let title = `Historial de ${getCategoryTitle(category)} (${filterType})`;
      if (category === "temperatura" && filterZone !== "todas") {
        title += ` - Zona ${getZoneText(filterZone)}`;
      }
      // 🔧 NUEVO: Incluir término de búsqueda en PDF
      if (activeSearch) {
        title += ` - Búsqueda: "${activeSearch}"`;
      }
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, 20, y);
      y += 15;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, y);
      y += 8;
      doc.text(`Total de registros: ${filtered.length}`, 20, y);
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Fecha/Hora", 20, y);
      doc.text("Valor", 80, y);
      
      if (category === "temperatura") {
        doc.text("Zona", 120, y);
        doc.text("Ciclo", 150, y);
        doc.text("Estado", 180, y);
      } else if (category === "humedad") {
        doc.text("Estado Muda", 120, y);
        doc.text("Estado", 160, y);
      } else if (category === "luz_uv") {
        doc.text("Ciclo", 120, y);
        doc.text("Estado", 160, y);
      }
      
      y += 10;
      doc.line(20, y, 190, y);
      y += 5;

      doc.setFontSize(9);
      
      filtered.forEach((item) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        if (item.es_critico) {
          doc.setTextColor(231, 76, 60);
          doc.setFont(undefined, 'bold');
        } else {
          doc.setTextColor(39, 174, 96);
          doc.setFont(undefined, 'normal');
        }
        
        const fechaCorta = formatDateTime(item.marca_tiempo).substring(0, 16);
        doc.text(fechaCorta, 20, y);
        doc.text(formatValue(item.medicion, category), 80, y);
        
        if (category === "temperatura") {
          doc.text(getZoneText(item.zona), 120, y);
          doc.text(getCycleText(item.ciclo || "dia"), 150, y);
          doc.text(item.es_critico ? "CRÍTICO" : "NORMAL", 180, y);
        } else if (category === "humedad") {
          doc.text(isInMudaState(item.estado_muda) ? "En muda" : "Normal", 120, y);
          doc.text(item.es_critico ? "CRÍTICO" : "NORMAL", 160, y);
        } else if (category === "luz_uv") {
          doc.text(getCycleText(item.ciclo || "dia"), 120, y);
          doc.text(item.es_critico ? "CRÍTICO" : "NORMAL", 160, y);
        }
        
        y += 8;
      });
      
      const timestamp = new Date().toISOString().slice(0, 10);
      let filename = category === "temperatura" && filterZone !== "todas" 
        ? `historial_${category}_${filterZone}_${filterType}_${timestamp}.pdf`
        : `historial_${category}_${filterType}_${timestamp}.pdf`;
      
      // 🔧 NUEVO: Incluir búsqueda en nombre de archivo
      if (activeSearch) {
        filename = filename.replace('.pdf', `_busqueda_${timestamp}.pdf`);
      }
      
      doc.save(filename);
      
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Inténtalo de nuevo.");
    }
  };

  const downloadExcel = () => {
    try {
      let wsData;
      
      if (category === "temperatura") {
        wsData = [
          ["Fecha/Hora", "Valor", "Zona", "Ciclo", "Estado"],
          ...filtered.map(item => [
            formatDateTime(item.marca_tiempo),
            formatValue(item.medicion, category),
            getZoneText(item.zona),
            item.ciclo || "dia",
            item.es_critico ? "CRÍTICO" : "NORMAL"
          ])
        ];
      } else if (category === "humedad") {
        wsData = [
          ["Fecha/Hora", "Valor", "Estado Muda", "Estado"],
          ...filtered.map(item => [
            formatDateTime(item.marca_tiempo),
            formatValue(item.medicion, category),
            isInMudaState(item.estado_muda) ? "En muda" : "Normal",
            item.es_critico ? "CRÍTICO" : "NORMAL"
          ])
        ];
      } else if (category === "luz_uv") {
        wsData = [
          ["Fecha/Hora", "Valor", "Ciclo", "Estado"],
          ...filtered.map(item => [
            formatDateTime(item.marca_tiempo),
            formatValue(item.medicion, category),
            item.ciclo || "dia",
            item.es_critico ? "CRÍTICO" : "NORMAL"
          ])
        ];
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
      
      const timestamp = new Date().toISOString().slice(0, 10);
      let filename = category === "temperatura" && filterZone !== "todas" 
        ? `historial_${category}_${filterZone}_${filterType}_${timestamp}.xlsx`
        : `historial_${category}_${filterType}_${timestamp}.xlsx`;
      
      // 🔧 NUEVO: Incluir búsqueda en nombre de archivo
      if (activeSearch) {
        filename = filename.replace('.xlsx', `_busqueda_${timestamp}.xlsx`);
      }
      
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error("Error generando Excel:", error);
      alert("Error al generar el Excel. Inténtalo de nuevo.");
    }
  };

  // 🔧 CAMBIADO: getCurrentValue sin redondeo, con 2 decimales
  const getCurrentValue = () => {
    const chartData = getDataForChart();
    if (chartData.length === 0) return "--";
    
    if (category === "temperatura") {
      if (filterZone === "fria") {
        const fria = chartData.find(d => (d.zona === "fría" || d.zona === "fria") && d.medicion !== null && d.medicion !== undefined);
        return fria ? `${parseFloat(fria.medicion).toFixed(2)}°C (Fría)` : "--";
      } else if (filterZone === "caliente") {
        const caliente = chartData.find(d => d.zona === "caliente" && d.medicion !== null && d.medicion !== undefined);
        return caliente ? `${parseFloat(caliente.medicion).toFixed(2)}°C (Caliente)` : "--";
      } else {
        const caliente = chartData.find(d => d.zona === "caliente" && d.medicion !== null && d.medicion !== undefined);
        const fria = chartData.find(d => (d.zona === "fría" || d.zona === "fria") && d.medicion !== null && d.medicion !== undefined);
        if (caliente && fria) return `${parseFloat(caliente.medicion).toFixed(2)}°C | ${parseFloat(fria.medicion).toFixed(2)}°C`;
        if (caliente) return `${parseFloat(caliente.medicion).toFixed(2)}°C (Caliente)`;
        if (fria) return `${parseFloat(fria.medicion).toFixed(2)}°C (Fría)`;
        return "--";
      }
    } else if (category === "humedad") {
      const valor = chartData[0]?.medicion;
      return (valor !== null && valor !== undefined) ? `${parseFloat(valor).toFixed(2)}%` : "--";
    } else if (category === "luz_uv") {
      const valor = chartData[0]?.medicion;
      return (valor !== null && valor !== undefined) ? parseFloat(valor).toFixed(2) : "--";
    }
    const valor = chartData[0]?.medicion;
    return (valor !== null && valor !== undefined) ? parseFloat(valor).toFixed(2) : "--";
  };

  const prepareChartData = (data, category) => {
    const sortedData = [...data].sort((a, b) => new Date(a.marca_tiempo) - new Date(b.marca_tiempo));
    
    if (category === "temperatura") {
      const colors = getChartColors(category);
      
      if (filterZone === "fria") {
        const friaData = sortedData.filter(d => d.zona === "fría" || d.zona === "fria");
        const rawValues = friaData.map(d => parseFloat(d.medicion));
        const processedValues = smoothForStraightLines(rawValues, 1.5);
        
        return {
          labels: friaData.map(d => formatTime(d.marca_tiempo)),
          datasets: [{
            label: "Zona Fría",
            data: processedValues,
            borderColor: colors.fria,
            backgroundColor: `${colors.fria}10`,
            borderWidth: 2,
            tension: 0.0,
            pointRadius: 2.5,
            pointBackgroundColor: colors.fria,
            pointBorderColor: colors.fria,
            pointBorderWidth: 0,
            fill: false,
            stepped: false
          }]
        };
        
      } else if (filterZone === "caliente") {
        const calienteData = sortedData.filter(d => d.zona === "caliente");
        const rawValues = calienteData.map(d => parseFloat(d.medicion));
        const processedValues = smoothForStraightLines(rawValues, 1.5);
        
        return {
          labels: calienteData.map(d => formatTime(d.marca_tiempo)),
          datasets: [{
            label: "Zona Caliente",
            data: processedValues,
            borderColor: colors.caliente,
            backgroundColor: `${colors.caliente}10`,
            borderWidth: 2,
            tension: 0.0,
            pointRadius: 2.5,
            pointBackgroundColor: colors.caliente,
            pointBorderColor: colors.caliente,
            pointBorderWidth: 0,
            fill: false,
            stepped: false
          }]
        };
        
      } else {
        const dataByZone = {
          fria: sortedData.filter(d => d.zona === "fría" || d.zona === "fria"),
          caliente: sortedData.filter(d => d.zona === "caliente")
        };
        
        const friaValues = dataByZone.fria.map(d => parseFloat(d.medicion));
        const calienteValues = dataByZone.caliente.map(d => parseFloat(d.medicion));
        
        const friaProcessed = smoothForStraightLines(friaValues, 1.5);
        const calienteProcessed = smoothForStraightLines(calienteValues, 1.5);
        
        return {
          labels: dataByZone.fria.map(d => formatTime(d.marca_tiempo)),
          datasets: [
            {
              label: "Zona Fría",
              data: friaProcessed,
              borderColor: colors.fria,
              backgroundColor: `${colors.fria}10`,
              borderWidth: 2,
              tension: 0.0,
              pointRadius: 2.5,
              pointBackgroundColor: colors.fria,
              pointBorderColor: colors.fria,
              pointBorderWidth: 0,
              fill: false,
              stepped: false
            },
            {
              label: "Zona Caliente",
              data: calienteProcessed,
              borderColor: colors.caliente,
              backgroundColor: `${colors.caliente}10`,
              borderWidth: 2,
              tension: 0.0,
              pointRadius: 2.5,
              pointBackgroundColor: colors.caliente,
              pointBorderColor: colors.caliente,
              pointBorderWidth: 0,
              fill: false,
              stepped: false
            }
          ]
        };
      }
    } else {
      const color = getChartColors(category);
      const rawValues = sortedData.map(d => parseFloat(d.medicion));
      const threshold = category === "humedad" ? 3.0 : 0.3;
      const processedValues = smoothForStraightLines(rawValues, threshold);
      
      return {
        labels: sortedData.map(d => formatTime(d.marca_tiempo)),
        datasets: [{
          label: category === "humedad" ? "Humedad" : "Luz UV",
          data: processedValues,
          borderColor: color,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          tension: 0.0,
          pointRadius: 2.5,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointBorderWidth: 0,
          fill: category === "humedad",
          stepped: false
        }]
      };
    }
  };

  // 🔧 CAMBIADO: Opciones del gráfico sin redondeo, mostrando 2 decimales
  const getChartOptions = (category, filterZone = null) => {
    const yAxisRange = getFixedYAxisRange(category, filterZone);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: category === "temperatura" && filterZone === "todas",
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              
              if (context.parsed.y !== null) {
                // 🔧 Sin redondeo, mostrando 2 decimales
                label += parseFloat(context.parsed.y).toFixed(2);
                if (category === 'temperatura') label += '°C';
                else if (category === 'humedad') label += '%';
                
                const dataIndex = context.dataIndex;
                const time = context.chart.data.labels[dataIndex];
                const originalData = getDataForChart().find(d => formatTime(d.marca_tiempo) === time);
                
                if (originalData) {
                  label += originalData.es_critico ? ' ⚠️ CRÍTICO' : ' ✅ NORMAL';
                  
                  if (category === 'humedad' && isInMudaState(originalData.estado_muda)) {
                    label += ' 🦎 MUDA';
                  }
                  
                  if (originalData.ciclo) label += ` | Ciclo: ${getCycleText(originalData.ciclo)}`;
                  
                  if (category === 'temperatura' && originalData.zona) {
                    label += ` | ${getZoneText(originalData.zona)}`;
                  }
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          min: yAxisRange.min,
          max: yAxisRange.max,
          grid: { color: '#f0f0f0', drawBorder: true },
          ticks: {
            callback: function(value) {
              // 🔧 Sin redondeo en los ticks del eje Y, mostrando 2 decimales
              return `${parseFloat(value).toFixed(2)}${category === 'temperatura' ? '°C' : category === 'humedad' ? '%' : ''}`;
            },
            stepSize: category === "temperatura" ? 5 : category === "humedad" ? 10 : 0.5,
            font: { size: 11 }
          },
          title: {
            display: true,
            text: category === 'temperatura' ? 'Temperatura (°C)' : 
                  category === 'humedad' ? 'Humedad (%)' : 'Valor UV',
            font: { size: 12, weight: 'bold' }
          }
        },
        x: {
          grid: { color: '#f0f0f0', drawBorder: true },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 },
            maxTicksLimit: 15
          },
          title: {
            display: true,
            text: 'Hora',
            font: { size: 12, weight: 'bold' }
          }
        }
      },
      animation: { duration: 800, easing: 'easeInOutQuart' },
      interaction: { intersect: false, mode: 'index' }
    };
  };

  const getChartTitle = () => {
    let title = getCategoryTitle(category);
    if (category === "temperatura" && filterZone !== "todas") {
      title += ` - Zona ${getZoneText(filterZone)}`;
    }
    title += ` - ${filterType}`;
    
    // 🔧 NUEVO: Incluir búsqueda en título del gráfico
    if (activeSearch) {
      title += ` - Búsqueda: "${activeSearch}"`;
    }
    
    const chartData = getDataForChart();
    if (mostrarTodosEnGrafico) {
      title += ` (${chartData.length} registros)`;
    } else {
      title += ` (últimos ${Math.min(maxRegistrosGrafico, chartData.length)} registros)`;
    }
    
    return title;
  };

  const getLimitesText = () => {
    if (!limitesSistema) return "";
    
    if (category === "temperatura") {
      const friaMin = limitesSistema.temperatura?.fria?.min;
      const friaMax = limitesSistema.temperatura?.fria?.max;
      const calienteMin = limitesSistema.temperatura?.caliente?.min;
      const calienteMax = limitesSistema.temperatura?.caliente?.max;
      
      if (filterZone === "fria") return `Zona Fría: ${friaMin}°C - ${friaMax}°C`;
      if (filterZone === "caliente") return `Zona Caliente: ${calienteMin}°C - ${calienteMax}°C`;
      return `Fría: ${friaMin}°C - ${friaMax}°C | Caliente: ${calienteMin}°C - ${calienteMax}°C`;
    } else if (category === "humedad") {
      const humedadMin = limitesSistema.humedad?.min || 30;
      const humedadMax = limitesSistema.humedad?.max || 50;
      
      if (estadoMudaActual === 1) {
        return `En muda: ${humedadMin}% - ${humedadMax}%`;
      } else {
        return `Normal: ${humedadMin}% - ${humedadMax}%`;
      }
    } else if (category === "luz_uv") {
      const uvMin = limitesSistema.luz_uv?.min || 0;
      const uvMax = limitesSistema.luz_uv?.max || 1;
      return `${uvMin} - ${uvMax}`;
    }
    
    return "";
  };

  const getTdComponent = (item) => item.es_critico ? CriticalTd : NormalTd;

  if (loading) {
    return (
      <PageContainer>
        <Header showUserIcon={true} />
        <Container><LoadingSpinner /></Container>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header showUserIcon={true} />
      <Container>
        
        <InfoBanner>
          <InfoTitle>Historial completo de condiciones ambientales para tu gecko leopardo.</InfoTitle>
          <InfoSubtitle>
            Valores críticos en rojo, valores normales en verde. Máximo 1000 registros por sensor.
            {internalLoading && (
              <span style={{ marginLeft: '10px', color: '#007bff', fontSize: '12px' }}>
                🔄 Actualizando datos...
              </span>
            )}
          </InfoSubtitle>
        </InfoBanner>

        {limitesSistema && (
          <CycleInfo>
            <CycleIndicator ciclo={cicloActual}>{getCycleIcon(cicloActual)}</CycleIndicator>
            <span>Ciclo actual: <strong>{getCycleText(cicloActual)}</strong> | Límites: {getLimitesText()}</span>
          </CycleInfo>
        )}

        <ControlsRow>
          <SelectGroup>
            <CategorySelect value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="temperatura">Temperatura</option>
              <option value="humedad">Humedad</option>
              <option value="luz_uv">Luz UV</option>
            </CategorySelect>

            {category === "temperatura" && (
              <CategorySelect value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
                <option value="todas">Todas las zonas</option>
                <option value="fria">Zona Fría</option>
                <option value="caliente">Zona Caliente</option>
              </CategorySelect>
            )}

            <CategorySelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="todos">Todos los registros</option>
              <option value="criticos">Solo críticos</option>
              <option value="normales">Solo normales</option>
            </CategorySelect>

            <CategorySelect value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
              <option value="all">Todo</option>
              <option value="today">Hoy</option>
              <option value="last3days">Últimos 3 días</option>
              <option value="last7days">Últimos 7 días</option>
            </CategorySelect>
          </SelectGroup>

          {/* 🔧 NUEVO: Sistema de búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '400px' }}>
            <SearchInput
              type="text"
              placeholder="Buscar por fecha, valor, zona o ciclo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
              style={{ flex: '1' }}
            />
            <DownloadButton 
              onClick={handleSearchClick}
              style={{ minWidth: '100px', backgroundColor: '#3498db', color: 'white' }}
            >
              🔍 Buscar
            </DownloadButton>
            {activeSearch && (
              <DownloadButton 
                onClick={clearSearch}
                style={{ minWidth: '80px', backgroundColor: '#e74c3c', color: 'white' }}
              >
                ✖️ Limpiar
              </DownloadButton>
            )}
          </div>
          
          <ButtonsContainer>
            <DownloadButton onClick={downloadPDF}>📄 PDF</DownloadButton>
            <DownloadButton onClick={downloadExcel}>📊 Excel</DownloadButton>
          </ButtonsContainer>
        </ControlsRow>

        {/* 🔧 NUEVO: Indicador de búsqueda activa */}
        {activeSearch && (
          <div style={{
            backgroundColor: '#e8f4fd', border: '1px solid #bee5eb', borderRadius: '5px',
            padding: '10px', marginBottom: '15px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>
              🔍 <strong>Búsqueda activa:</strong> "{activeSearch}" 
              <span style={{ marginLeft: '10px', color: '#666' }}>
                ({filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''})
              </span>
            </span>
          </div>
        )}

        {selectedItems.size > 0 && (
          <ActionButtonsContainer>
            <SelectionText>{selectedItems.size} de {filtered.length} registro(s) seleccionado(s)</SelectionText>
            <DeleteButton onClick={deleteSelectedRecords} disabled={deleting || selectedItems.size === 0}>
              {deleting ? "Eliminando..." : "🗑️ Eliminar seleccionados"}
            </DeleteButton>
          </ActionButtonsContainer>
        )}

        <ContentRow>
          <DataPanel>
            <Table>
              <thead>
                <tr>
                  <Th>
                    <Checkbox
                      checked={allFilteredSelected}
                      onChange={(e) => handleSelectAllRecords(e.target.checked)}
                      title={`Seleccionar todos los ${filtered.length} registros`}
                    />
                  </Th>
                  <Th>Fecha/Hora</Th>
                  <Th>Valor</Th>
                  {category === "temperatura" && <Th>Zona</Th>}
                  {category === "humedad" && <Th>Estado Muda</Th>}
                  {(category === "temperatura" || category === "luz_uv") && <Th>Ciclo</Th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => {
                    const TdComponent = getTdComponent(item);
                    const isSelected = selectedItems.has(item.id);
                    
                    return (
                      <tr key={`${item.marca_tiempo}-${index}`}>
                        <CheckboxTd>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                          />
                        </CheckboxTd>
                        <TdComponent>{formatDateTime(item.marca_tiempo)}</TdComponent>
                        <TdComponent>{formatValue(item.medicion, category)}</TdComponent>
                        
                        {category === "temperatura" && (
                          <TdComponent>{getZoneText(item.zona)}</TdComponent>
                        )}
                        
                        {category === "humedad" && (
                          <TdComponent>
                            {isInMudaState(item.estado_muda) ? "En muda 🦎" : "Normal"}
                          </TdComponent>
                        )}
                        
                        {(category === "temperatura" || category === "luz_uv") && (
                          <CycleTd>
                            <TableCycleIndicator ciclo={item.ciclo || 'dia'} />
                            {getCycleText(item.ciclo || 'dia')}
                          </CycleTd>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <Td colSpan={category === "temperatura" ? 5 : category === "humedad" ? 4 : 4} 
                        style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                      {/* 🔧 NUEVO: Mensaje personalizado para búsquedas */}
                      {activeSearch 
                        ? `No se encontraron registros de ${getCategoryTitle(category)} que coincidan con "${activeSearch}".`
                        : filterType === "todos" 
                          ? `Aún no hay registros de ${getCategoryTitle(category)}.`
                          : `No hay registros ${filterType} de ${getCategoryTitle(category)} con los filtros aplicados.`
                      }
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationButton 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                >
                  « Anterior
                </PaginationButton>
                <PaginationText>
                  Página {currentPage} de {totalPages} ({filtered.length} registros total)
                </PaginationText>
                <PaginationButton 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                >
                  Siguiente »
                </PaginationButton>
              </Pagination>
            )}
          </DataPanel>

          <DataPanel>
            <ChartContainer>
              <ChartTitleContainer>
                <ChartTitle>{getChartTitle()}</ChartTitle>
              </ChartTitleContainer>
              
              <CurrentValue>
                {getCurrentValue()}
                {category === "humedad" && getDataForChart().length > 0 && isInMudaState(getDataForChart()[0]?.estado_muda) && (
                  <span style={{ fontSize: "16px", marginLeft: "10px", color: "#8e44ad" }}>🦎 En muda</span>
                )}
              </CurrentValue>
              
              <ChartWrapper>
                <Line 
                  data={prepareChartData(getDataForChart(), category)} 
                  options={getChartOptions(category, filterZone)}
                />
              </ChartWrapper>
              
              <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                flexWrap: 'wrap' 
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  fontSize: '14px' 
                }}>
                  <input 
                    type="checkbox" 
                    checked={mostrarTodosEnGrafico} 
                    onChange={handleMostrarTodosChange} 
                    style={{ cursor: 'pointer' }} 
                  />
                  Mostrar todos ({filtered.length} registros)
                </label>
                
                {!mostrarTodosEnGrafico && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px' }}>Mostrar últimos:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000" 
                      value={inputRegistrosGrafico} 
                      onChange={handleInputRegistrosChange} 
                      style={{ 
                        width: '80px', 
                        padding: '4px 8px', 
                        border: '1px solid #ced4da', 
                        borderRadius: '4px', 
                        fontSize: '14px' 
                      }} 
                    />
                    <span style={{ fontSize: '14px' }}>registros</span>
                  </div>
                )}
              </div>
            </ChartContainer>
          </DataPanel>
        </ContentRow>

        {/* 🔧 NUEVO: Modal de búsqueda */}
        <SearchModal 
          show={showSearchModal} 
          onClose={() => setShowSearchModal(false)}
          searchTerm={searchInput}
          resultsCount={filtered.length}
        />
        
      </Container>
      <Footer />
    </PageContainer>
  );
};

export default Historial;