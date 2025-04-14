import styled from "styled-components";

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
    border-color: #b4864d;
  }
`;

const RightButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
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
  width: 50%;
  min-width: 300px;
  min-height: 450px;
  max-height: 500px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1200px) {
    width: 100%;
    max-width: 100%;
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

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  min-height: 300px;
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
  background-color: #ff8c00;
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

export {
  Container,
  Row,
  ControlsRow,
  ContentRow,
  CategorySelect,
  RightButtonsContainer,
  DownloadButton,
  DataPanel,
  Table,
  Th,
  Td,
  ChartContainer,
  CurrentValue,
  ChartTitle,
  ChartTitleContainer,
};
