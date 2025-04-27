import styled from "styled-components"; 

export const CycleImage = styled.img`
  width: 60px;
  height: 60px;
`;

export const Container = styled.div`
  padding: 80px 30px 1px;
  margin: auto;
  max-width: 1400px;
  background: #f8f4e1;
  border-radius: 20px;
  box-shadow: 0px 4px 10px rgba(184, 133, 133, 0.2);
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 10px; 
  align-items: flex-start;
  min-height: 100vh; 
  box-sizing: border-box;
  overflow-x: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;


export const CardTitle = styled.h3`
  background: #093609;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
  margin: -80px 70px 60px;
  width: 60%;
  top: -20px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: center; 
  gap: 15px; 
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  z-index: 3;
  position: relative;
`;

export const ModeButton = styled.button`
  flex: 0 0 48%;
  background: ${({ active }) => (active ? "#093609" : "#E0E2E6")};
  color: ${({ active }) => (active ? "white" : "black")};
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  font-size: 16px;

  &:hover {
    background: ${({ disabled }) => (disabled ? "#E0E2E6" : "#093609")};
    color: ${({ disabled }) => (disabled ? "black" : "white")};
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
  margin-top: 30px;
  margin-bottom:70px;
  background: rgba(123, 95, 61, 0.8);
  border: 1px solid rgba(248, 216, 186, 0.25);
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  color: black;
  text-align: center;
  height: 350px; 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  padding: 60px 10px 1px;
`;

export const InfoTitle = styled.h5`
  margin: 8px 0 12px;
  font-size: 16px;
  font-weight: bold;
  color: #5c4033;
  text-align: center;
  margin-top: 2px;
  &::after {
    content: " (informativo)";
    font-size: 12px;
    font-weight: normal;
    color: #a1887f;
  }
`;


export const GridInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-top: 8px;
  text-align: left;
`;


export const ChartWithInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: auto auto;
  gap: -30px; 
`;


export const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 500;
  font-size: 13px;
`;


export const SmallNote = styled.div`
  margin-top: 15px;
  padding: 10px;
  font-size: 14px;
  background: #fce8e6;
  color: #c0392b;
  text-align: center;
  border-radius: 8px;
  font-weight: bold;
  width: 90%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
`;


export const MiniCard = styled.div`
  background: #f7d9b3;
  color: black; 
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  border: 1px solid rgb(191, 161, 122);
  box-shadow: 0 0 8px 2px rgba(63, 49, 30, 0.8);
  font-weight: bold;
  display: inline-block;
  border-radius: 10px;
  width: 100%;
  text-align: center;
  margin-top: -40px;
  margin-bottom: 25px;
  padding: 10px 10px 20px;
`;

export const InfoMiniCard = styled.div`
  background: #fff8e7;
  color: #4b3621;
  font-family: 'Arial', sans-serif;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #d9c2a3;
  padding: 7px 12px;
  border-radius: 8px;
  width: 90%;
  margin-top: -10px;
  max-width: 80%;
  text-align: center;
  line-height: 1.3;
  box-shadow: 0 0 8px 2px rgba(0,0,0,0.3);
`;


export const RightMiniCard = styled.div`
background: #f7d9b3;
  color: black;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px; 
  border: 1px solid rgb(191, 161, 122);
  box-shadow: 0 0 8px 2px rgba(63, 49, 30, 0.8);
  padding: 10px;
  border-radius: 10px;
  width: 90%;
  max-width: 300px;
  text-align: center;
  margin: 10px auto; 
`;

export const RightCardTitle = styled.h3`
  background: #093609;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 20px;
  text-align: center;
  width: fit-content;
  margin: -35px auto 20px; 
  position: relative;
  z-index: 5;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
`;


export const RightMiniCardText = styled.span`
  flex: 1;
`;

export const RightMiniCardIcon = styled.img`
  width: 30px;
  height: 30px;
`;

export const SectionTitle = styled.h4`
  background: #093609;
  color: white;
  padding: -100px 8px 12px;
  border-radius: 10px;
  font-size: 16px;
  text-align: center;
  margin-bottom: 10px;
`;


export const CenterContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 20px;
`;

export const ChartWrapper = styled.div`
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  width: 100%;
`;

// Ajuste del Panel derecho 
export const RightColumnFixed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow: hidden;
`;


export const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: -600px;
  padding-bottom: 5px; 
  padding: -19px 0 20px 0;
  box-sizing: border-box;
`;


export const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;  
  gap: 100px;
  padding-bottom: 5px; 
  padding: 90px 0 20px 0;
  box-sizing: border-box;
`;

export const CardLarge = styled.div`
  margin-top: 30px;
  margin-bottom:70px;
  background: rgba(123, 95, 61, 0.8);
  border: 1px solid rgba(248, 216, 186, 0.25);
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  color: black;
  text-align: center;
  height: 300px; 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  padding: 60px 10px 1px;
`;

export const MiniCardLuz = styled.div`
 background: #f7d9b3;
  color: black; 
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  border: 1px solid rgb(191, 161, 122);
  box-shadow: 0 0 8px 2px rgba(63, 49, 30, 0.8);
  font-weight: bold;
  border-radius: 10px;
  width: 100%;
  margin-top: 43px;
  align-items: center;
  text-align: center;
  padding: 10px 10px 10px;
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 70px;
  padding: 1px 1px 5px; 
  box-sizing: border-box;
  width: 100%; 
  max-height: none;
  align-items: center;
`;


export const ControlPanel = styled(Card)`
 padding: 20px 10px 5px;
  min-height: 450px;
  align-items: center;
  justify-content:center;
`;


export const Overlay = styled.div`
  position: absolute;
  top: 70px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
  display: ${({ active }) => (active ? "block" : "none")};
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

export const ChartBlock = styled.div`
  background: white;
  border-radius: 15px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  min-height: 300px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 5px;
`;

export const ChartContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 0 10px 0; 
`;

export const ChartTitle = styled.h4`
  background:rgba(82, 54, 22, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin: -30px 80px 20px;
  width: fit-content;
  width: 100%;
`;

export const HalfChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const StatusPanel = styled(Card)`
  padding: 10px;
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
 width: 180%;
  max-width: 1000px;
  height: 25px;
  background: #ccced0;
  border-radius: 1000px;
  position: relative;
  display: flex;
  align-items: left;
  margin: 0px -50px 2px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

export const ProgressBar = styled.div`
  height: 100%;
  background: #4caf50;
  border-radius: 1000px;
  width: ${({ value }) => ((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%;
  transition: width 0.3s ease-out;
`;

export const SliderCircle = styled.div`
  width: 26px;
  height: 26px;
  background: rgba(0, 0, 0, 0.83);
  border: 3px solid rgb(0, 0, 0);
  border-radius: 50%;
  position: absolute;
  left: ${({ value }) => `calc(${((value - 20) / (100 - 20)) * 100}% - 13px)`};
  top: 50%;
  transform: translateY(-50%);
  transition: left 0.2s ease-out;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "grab")};
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

export const Content = styled.div`
position: relative;
  z-index: 2;

  &[data-disabled='true'] {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;

    ${MiniCard}, ${SliderContainer}, ${ControlButton} {
      cursor: not-allowed !important;
    }
  }
`;