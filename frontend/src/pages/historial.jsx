import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/Loading";
import {
  Container, ControlsRow, ContentRow, CategorySelect,
  RightButtonsContainer, DownloadButton, DataPanel,
  Table, Th, Td, ChartContainer, CurrentValue,
  ChartTitle, ChartTitleContainer
} from "../styles/historialStyles";
import styled from "styled-components";

const InfoBanner = styled.div`
  background-color: #ffe8c9;
  color: #8a5a00;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
`;

const formatDate = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
};

const formatTime = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const getChartColors = (category) => {
  switch (category) {
    case "temperatura":
      return { bgColor: "#3498db", gradient: ["#3498db", "#f39c12", "#e74c3c"] };
    case "humedad":
      return { bgColor: "#27ae60", gradient: ["#27ae60", "#2ecc71"] };
    case "luz_uv":
      return { bgColor: "#9b59b6", gradient: ["#f1c40f", "#9b59b6"] };
    default:
      return { bgColor: "#ff8c00", gradient: ["#ff8c00"] };
  }
};

const prepareChartData = (data, category) => {
  const colors = getChartColors(category);
  const lastData = data.slice(-10);
  const values = lastData.map((d) => parseFloat(d.medicion));
  const labels = lastData.map((d) => formatTime(d.marca_tiempo));

  return {
    labels,
    datasets: [
      {
        label: category,
        data: values,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          colors.gradient.forEach((color, i) => {
            gradient.addColorStop(i / (colors.gradient.length - 1), color);
          });
          return gradient;
        },
        borderColor: colors.gradient[0],
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: colors.gradient[0],
        pointBorderColor: "#FFF",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
};

const Historial = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("temperatura");
  const [filterDate, setFilterDate] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/historial/${category}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  const applyDateFilter = (list) => {
    if (filterDate === "all") return list;

    const now = new Date();
    let daysAgo = filterDate === "today" ? 0 : filterDate === "last3days" ? 3 : 7;
    const limitDate = new Date();
    limitDate.setDate(now.getDate() - daysAgo);

    return list.filter((item) => new Date(item.marca_tiempo) >= limitDate);
  };

  const filtered = applyDateFilter(
    data.filter(
      (d) =>
        formatDate(d.marca_tiempo).toLowerCase().includes(search.toLowerCase()) ||
        d.medicion.toString().toLowerCase().includes(search.toLowerCase()) ||
        (d.zona?.toLowerCase() || "").includes(search.toLowerCase())
    )
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.text(`Historial de ${category}`, 20, y);
    y += 10;
    doc.text("Fecha", 20, y);
    doc.text("Dato", 80, y);
    doc.text("Zona", 140, y);
    y += 10;

    filtered.forEach((d) => {
      doc.text(formatDate(d.marca_tiempo), 20, y);
      doc.text(`${d.medicion}`, 80, y);
      doc.text(d.zona || "-", 140, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`historial_${category}.pdf`);
  };

  const downloadExcel = () => {
    const wsData = [
      ["Fecha", "Dato", "Zona"],
      ...filtered.map((d) => [formatDate(d.marca_tiempo), d.medicion, d.zona || "-"]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
    XLSX.writeFile(workbook, `historial_${category}.xlsx`);
  };

  if (loading) {
    return (
      <>
        <Header showUserIcon={true} />
        <Container><LoadingSpinner /></Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header showUserIcon={true} />
      <Container>
        <InfoBanner>
          Este historial ayuda a analizar las condiciones ambientales de tu gecko. Puedes filtrar por fecha, tipo de dato y descargar para estudios.
        </InfoBanner>

        <ControlsRow>
          <CategorySelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="temperatura">Temperatura</option>
            <option value="humedad">Humedad</option>
            <option value="luz_uv">Iluminación</option>
          </CategorySelect>

          <CategorySelect value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option value="all">Todo</option>
            <option value="today">Hoy</option>
            <option value="last3days">Últimos 3 días</option>
            <option value="last7days">Últimos 7 días</option>
          </CategorySelect>

          <RightButtonsContainer>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <DownloadButton onClick={downloadPDF}>⬇🔽 PDF</DownloadButton>
            <DownloadButton onClick={downloadExcel}>⬇🔽 Excel</DownloadButton>
          </RightButtonsContainer>
        </ControlsRow>

        <ContentRow>
          <DataPanel>
            <Table>
              <thead>
                <tr><Th>Fecha</Th><Th>Dato</Th><Th>Zona</Th></tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item, index) => (
                    <tr key={index}>
                      <Td>{formatDate(item.marca_tiempo)}</Td>
                      <Td>{item.medicion}</Td>
                      <Td>{item.zona || "-"}</Td>
                    </tr>
                  ))
                ) : (
                  <tr><Td colSpan={3} style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                    Aún no hay registros de {category}.
                  </Td></tr>
                )}
              </tbody>
            </Table>
          </DataPanel>

          <DataPanel>
            <ChartContainer>
              <ChartTitleContainer>
                <ChartTitle>{category.charAt(0).toUpperCase() + category.slice(1)}</ChartTitle>
              </ChartTitleContainer>
              <CurrentValue>{filtered[0]?.medicion ?? "--"}</CurrentValue>
              <div style={{ flexGrow: 1, overflow: "hidden" }}>
                <Line data={prepareChartData(filtered, category)} options={{ responsive: true }} />
              </div>
            </ChartContainer>
          </DataPanel>
        </ContentRow>
      </Container>
      <Footer />
    </>
  );
};

export default Historial;
