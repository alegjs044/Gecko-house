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

const formatDate = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getDate().toString().padStart(2, "0")}/${
    (date.getMonth() + 1).toString().padStart(2, "0")
  }/${date.getFullYear()}`;
};

const formatTime = (dateTime) => {
  const date = new Date(dateTime);
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const prepareChartData = (data) => {
  const lastData = data.slice(0, 6).reverse();
  const values = lastData.map((d) => parseFloat(d.raw.Medicion));
  const labels = lastData.map((d) => formatTime(d.raw.Marca_tiempo));

  return {
    labels,
    datasets: [
      {
        label: "Temperatura",
        data: values,
        fill: false,
        backgroundColor: "rgba(255, 165, 0, 0.2)",
        borderColor: "#FFA500",
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: "#FFA500",
        pointBorderColor: "#FFF",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y}°C`,
      },
    },
  },
  scales: {
    x: {
      title: { display: true, text: "Hora", font: { size: 14 } },
    },
    y: {
      title: { display: true, text: "Temperatura (°C)", font: { size: 14 } },
      min: 15,
      max: 45,
      ticks: { stepSize: 5 },
    },
  },
};

const Historial = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("temperatura");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000");

    socket.onmessage = (event) => {
      const { valor, timestamp, zona } = JSON.parse(event.data);

      if (!valor || isNaN(parseFloat(valor))) return;

      const entry = {
        fecha: formatDate(timestamp),
        dato: `${valor}°C`,
        zona: zona || "Zona",
        raw: {
          Marca_tiempo: timestamp,
          Medicion: valor,
          Zona: zona || "Zona",
        },
      };

      setData((prev) => {
        const next = [entry, ...prev];
        return next.length > 100 ? next.slice(0, 100) : next;
      });

      setLoading(false);
    };

    const fallback = setTimeout(() => {
      if (data.length === 0) setLoading(false);
    }, 3000);

    return () => {
      socket.close();
      clearTimeout(fallback);
    };
  }, [data.length]);

  const filtered = data.filter(
    (d) =>
      d.fecha.toLowerCase().includes(search.toLowerCase()) ||
      d.dato.toLowerCase().includes(search.toLowerCase()) ||
      d.zona.toLowerCase().includes(search.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.text("Historial de Temperatura", 20, y);
    y += 10;

    doc.text("Fecha", 20, y);
    doc.text("Dato", 80, y);
    doc.text("Zona", 140, y);
    y += 10;

    filtered.forEach((d) => {
      doc.text(d.fecha, 20, y);
      doc.text(d.dato, 80, y);
      doc.text(d.zona, 140, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("historial_temperatura.pdf");
  };

  const downloadExcel = () => {
    const wsData = [
      ["Fecha", "Dato", "Zona"],
      ...filtered.map((d) => [d.fecha, d.dato, d.zona]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
    XLSX.writeFile(workbook, "historial_temperatura.xlsx");
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
        <ControlsRow>
          <CategorySelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="temperatura">Temperatura</option>
            <option value="humedad" disabled>Humedad (próximamente)</option>
            <option value="luz_uv" disabled>Iluminación (próximamente)</option>
          </CategorySelect>
          <RightButtonsContainer>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            />
            <DownloadButton onClick={downloadPDF}>PDF</DownloadButton>
            <DownloadButton onClick={downloadExcel}>Excel</DownloadButton>
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
                      <Td>{item.fecha}</Td>
                      <Td>{item.dato}</Td>
                      <Td>{item.zona}</Td>
                    </tr>
                  ))
                ) : (
                  <tr><Td colSpan={3}>No hay datos disponibles</Td></tr>
                )}
              </tbody>
            </Table>
          </DataPanel>

          <DataPanel>
            <ChartContainer>
              <ChartTitleContainer>
                <ChartTitle>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </ChartTitle>
              </ChartTitleContainer>
              <CurrentValue>{filtered[0]?.dato || "--"}</CurrentValue>
              <div style={{ flexGrow: 1 }}>
                <Line data={prepareChartData(filtered)} options={chartOptions} />
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
