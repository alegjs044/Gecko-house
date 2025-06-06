import styled from "styled-components";

// Estilos para componentes del historial
export const PageContainer = styled.div`
  background-color: #fff8e8;
  min-height: 100vh;
  padding-bottom: 30px;
  position: relative;
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  margin-top: 80px;
`;

export const InfoBanner = styled.div`
  background-color: #f5efe0;
  color: #8b6e44;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  border: 1px solid #e8d5b9;
`;

export const InfoTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: #85632e;
  margin-bottom: 8px;
`;

export const InfoSubtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: #8b6e44;
`;

// Estilo mejorado para la fila de controles
export const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 10px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SelectGroup = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const CategorySelect = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  min-width: 150px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
`;

export const SearchInput = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: space-between;
    width: 100%;
  }
`;

export const Button = styled.button`
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;
  white-space: nowrap;
`;

export const UpdateButton = styled(Button)`
  background-color: #4a90e2;
  color: white;
  &:hover {
    background-color: #3a7bc8;
  }
`;

export const DownloadButton = styled(Button)`
  background-color: #f8f9fa;
  color: #444;
  border: 1px solid #ddd;
  &:hover {
    background-color: #eaecef;
  }
`;

// NUEVO: Botón de eliminar
export const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  color: white;
  &:hover {
    background-color: #c0392b;
  }
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

export const ContentRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

export const DataPanel = styled.div`
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  text-align: left;
  padding: 12px 15px;
  background-color: #e0c9a6;
  color: #7a5c2d;
  font-size: 15px;
  font-weight: 600;
`;

export const Td = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
`;

// NUEVO: Td para checkbox
export const CheckboxTd = styled(Td)`
  width: 40px;
  text-align: center;
  padding: 12px 8px;
`;

// NUEVO: Checkbox personalizado
export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4a90e2;
`;

// Estilo para valores críticos (solo texto rojo)
export const CriticalTd = styled(Td)`
  color: #e74c3c !important;
  font-weight: 600 !important;
`;

// Estilo para valores normales (solo texto verde)
export const NormalTd = styled(Td)`
  color: #27ae60 !important;
`;

// Estilo para valores en estado de muda
export const MudaTd = styled(Td)`
  color: #8e44ad !important;
  font-weight: 500 !important;
`;

// Estilo para mostrar el ciclo en la tabla
export const CycleTd = styled(Td)`
  position: relative;
  font-weight: 500;
`;

// Indicador de ciclo en la tabla
export const TableCycleIndicator = styled.span`
  display: inline-flex;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 5px;
  background-color: ${props => {
    if (props.ciclo === 'dia') return '#f9ca24';
    if (props.ciclo === 'noche') return '#34495e';
    if (props.ciclo === 'diaam') return '#fd79a8'; 
    return '#a5b1c2';
  }};
  vertical-align: middle;
`;

export const ChartContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const ChartTitleContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

export const ChartTitle = styled.div`
  background-color: #d9a558;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
`;

export const CurrentValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin: 10px 0 20px;
  color: #333;
`;

export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
  padding: 0 15px;
  flex-wrap: wrap;
`;

export const PaginationButton = styled.button`
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  background-color: #4a90e2;
  color: white;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: #3a7bc8;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const PaginationText = styled.div`
  padding: 8px 15px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
`;

export const ChartWrapper = styled.div`
  flex-grow: 1;
  position: relative;
  height: 300px;
  width: 100%;
`;

export const CycleInfo = styled.div`
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

// Indicador mejorado para ciclo actual
export const CycleIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  background-color: ${props => {
    if (props.ciclo === 'dia') return '#f9ca24';
    if (props.ciclo === 'noche') return '#34495e';
    if (props.ciclo === 'diaam') return '#fd79a8';
    return '#a5b1c2';
  }};
  color: ${props => props.ciclo === 'noche' ? '#fff' : '#000'};
`;

// NUEVO: Contenedor para botones de acción
export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  align-items: center;
`;

// NUEVO: Texto de selección
export const SelectionText = styled.span`
  font-size: 14px;
  color: #666;
  margin-right: 10px;
`;