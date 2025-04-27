import styled from "styled-components";

const Container = styled.div`
  padding: 70px 30px 40px;
  margin: auto;
  max-width: 1400px;
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-height: 90vh;
  <margin-bottom: 30px>;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  border-radius: 25px;
`;

const ControlsRow = styled(Row)`
  background: transparent;
  justify-content: flex-start;
  gap: 20px;
  padding: 10px 20px 0;
  flex-wrap: wrap;
`;

const ContentRow = styled(Row)`
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 40px;

  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CategorySelect = styled.select`
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid #ccc;
  background-color: white;
  width: 250px;
  font-size: 15px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='black' stroke-width='2' viewBox='0 0 24 24'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2em;

  &:focus {
    outline: none;
    border-color: #b4864d;
  }
`;

const RightButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`;

const DownloadButton = styled.button`
  background-color: #ff8c00;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 8px 15px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background-color: #e67e00;
  }

  &::after {
    content: "\2193";
    font-size: 18px;
  }
`;

const DataPanel = styled.div`
  background: rgba(123, 95, 61, 0.9);
  border-radius: 20px;
  padding: 20px;
  width: 100%;
  min-width: 300px;
  min-height: 450px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 1200px) {
    width: 100%;
    max-width: 100%;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(135deg, #fff, #f1f1f1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
`;

const Th = styled.th`
  background-color: ${(props) => props.color || "#ffe8c9"};
  color: #333;
  padding: 10px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 2px solid #ddd;
`;

const Td = styled.td`
  padding: 8px 10px;
  text-align: center;
  font-size: 14px;
  border-bottom: 1px solid #eee;

  &:hover {
    background-color: #f2f2f2;
  }
`;

const ChartContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const CurrentValue = styled.div`
  text-align: center;
  font-size: 2.8rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ChartTitle = styled.h3`
  text-align: center;
  background-color: ${(props) => props.bgColor || "#ff8c00"};
  color: white;
  padding: 6px 15px;
  border-radius: 8px;
  margin: 0 auto 10px;
  font-size: 18px;
  display: inline-block;
`;

const ChartTitleContainer = styled.div`
  text-align: center;
  margin-bottom: 15px;
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