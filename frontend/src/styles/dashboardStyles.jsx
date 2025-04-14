import styled from "styled-components";

export const CycleImage = styled.img`
  width: 60px;
  height: 60px;
`;

export const Container = styled.div`
  padding: 50px 30px;
  margin: auto;
  max-width: 1400px;
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
  min-height: 85vh;
  align-items: stretch;
`;

export const CardTitle = styled.h3`
  background: #093609;
  padding: 12px;
  border-radius: 10px;
  font-size: 18px;
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  text-align: center;
  color: white;
  z-index: 3;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  z-index: 3;
  position: relative;
`;

export const ModeButton = styled.button`
  flex: 1;
  margin: 5px;
  background: ${({ active }) => (active ? "#093609" : "#E0E2E6")};
  color: ${({ active }) => (active ? "white" : "black")};
  font-weight: bold;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: #093609;
    color: white;
  }
`;

export const SwitchContainer = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
`;

export const SwitchWrapper = styled.div`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${({ checked }) => (checked ? "#4caf50" : "#ccc")};
  border-radius: 15px;
  transition: background-color 0.3s ease-in-out;
`;

export const Slider = styled.div`
  position: absolute;
  top: 3px;
  left: ${({ checked }) => (checked ? "26px" : "3px")};
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease-in-out;
`;

export const HiddenCheckbox = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

export const Card = styled.div`
  background: rgba(123, 95, 61, 0.8);
  border: 1px solid rgba(248, 216, 186, 0.25);
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  color: black;
  text-align: center;
  height: 80%;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const MiniCard = styled.div`
  background: #EFBF86;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  color: black;
  text-align: center;
  width: 100%;
  margin-bottom: 10px;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const CenterColumn = styled(Column)`
  justify-content: space-between;
`;

export const RightColumn = styled(Column)`
  justify-content: space-between;
  height: 90%;
`;

export const ControlPanel = styled(Card)`
  padding: 65px 20px 20px;
  height: 100%;
`;

export const Overlay = styled.div`
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  display: ${({ active }) => (active ? "block" : "none")};
  z-index: 2;
`;

export const Content = styled.div`
  position: relative;
  z-index: 2;
`;

export const ControlButton = styled.button`
  background: ${({ disabled }) => (disabled ? "#ccc" : "#000")};
  border: none;
  color: white;
  padding: 10px;
  font-size: 14px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  border-radius: 8px;
`;

export const ChartContainer = styled.div`
  background: white;
  padding: 15px;
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
`;

export const StatusPanel = styled(Card)`
  padding: 20px;
  height: 100%;
`;

export const StatusItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  font-weight: bold;
  background: ${({ color }) => color || "gray"};
  padding: 10px;
  border-radius: 10px;
  margin-top: 10px;
  color: white;
`;

export const StatusImage = styled.img`
  width: 40px;
  height: 40px;
`;

export const MIN_TEMP = 20;
export const MAX_TEMP = 100;
export const STEP = 5;

export const SliderContainer = styled.div`
  width: 90%;
  height: 12px;
  background: #ccced0;
  border-radius: 1000px;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 20px;
`;

export const ProgressBar = styled.div`
  height: 100%;
  background: #4caf50;
  border-radius: 1000px;
  width: ${({ value }) => ((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%;
  transition: width 0.3s ease-out;
`;

export const SliderCircle = styled.div`
  width: 22px;
  height: 22px;
  background: white;
  border: 3px solid #4caf50;
  border-radius: 50%;
  position: absolute;
  left: ${({ value }) => `calc(${((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}% - 11px)`};
  top: 50%;
  transform: translateY(-50%);
  transition: left 0.2s ease-out;
  cursor: grab;
`;

export const MarkersContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
`;

export const Marker = styled.div`
  width: 2px;
  height: ${({ isMajor }) => (isMajor ? "15px" : "10px")};
  background: ${({ active }) => (active ? "#4caf50" : "white")};
  opacity: 0.5;
  position: relative;

  &:hover::after {
    content: "${({ temp }) => temp}°C";
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.7);
    padding: 3px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }
`;
