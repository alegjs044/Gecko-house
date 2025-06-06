import { motion } from "framer-motion";
import styled from "styled-components";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  gap: 30px;
  padding: 0 16px;
;`

const MainContainer = styled.div`
  margin-top: 100px;
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
`;

const TopCards = styled.div`
  margin-top: 70px;
  display: grid;
  align-self: flex-start; 
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 15px;
  width:54%;
  margin-bottom: -90px;
  
  @media (max-width: 700x) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
  }
  
  @media (max-width: 200px) {
    grid-template-columns: 1fr;
    gap: 4px;
  }
    & > div {
  flex: 1 1 200px;
  max-width: 250px;
  min-width: 160px;
  height: 90px;               /* más delgadas */
  padding: 8px 9px;          /* menos espacio interior */
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(14, 11, 11, 0.44);
  border: 1px solid rgba(0,0,0,0.08);
  
}
  
h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color:rgb(6, 24, 41);
      text-align: center;
      font-family: 'Roboto Mono', monospace; /* Fuente monospace para datos */
    }
    
    p {
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
      text-align: center;
    }
    
    /* Indicador de dato en vivo */
    &::before {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #27ae60;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  }
`;

const StatusCard = styled(motion.div)`
  background: ${props => props.bgColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
;`

const StatusTitle = styled.h3`
  font-size: 14px;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin: 0 0 8px 0;
  }
;`

const StatusValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    font-size: 14px;
    gap: 6px;
  }
;`

const StatusIcon = styled.img`
  width: 24px;
  height: 24px;
  
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
  }
;`

const CycleIcon = styled.img`
  width: 30px;
  height: 30px;
  
  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
;`

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 15px;
  }
;`

const ToastContainer = styled(motion.div)`
  position: fixed;
  bottom: 80px; /* antes 30px, ahora más arriba */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 300px;
  max-width: 90vw;
  padding: 16px 28px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  color: white;
  text-align: center;
  background: ${props => props.isAuto
    ? 'rgba(46, 125, 50, 0.85)'
    : 'rgba(211, 47, 47, 0.85)'};
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  transition: opacity 0.3s ease, transform 0.3s ease;

  @media (max-width: 768px) {
    bottom: 100px; /* más alto aún en móvil por seguridad */
    font-size: 13px;
    padding: 12px 20px;
  }
;


const ToastMessage = styled.div
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  left: 43%;
  transform: translateX(-50%);
;`

const ToastTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 16px;
    letter-spacing: 0.5px;
  }
;`

const ToastSubtitle = styled.div`
  font-size: 12px;
  opacity: 0.9;
  font-weight: normal;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
;`

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 10px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 10px;
  }
  
  @media (max-width: 1024px) {
    padding-right: 0;
    max-height: none;
    overflow-y: visible;
  }
;`

const RightSection = styled.div`
  max-width: 100%;
  display: flex;
  padding: 10px;
  flex-direction: column;
  gap: 15px;
  position: sticky;
  top: 20px;
  height: fit-content;
  margin-bottom: 60px;
  min-height: 500px; /* ✅ Altura mínima para evitar movimientos */
  
  @media (max-width: 1024px) {
    width: 100%;
    position: static;
    margin-bottom: 20px;
  }
;`

const ChartWithMonitorRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
  margin-top: 10px;

  @media (max-width: 768px) {
    gap: 15px;
  }
;`


const ChartCard = styled.div`
  background: rgba(255,255,255,0.95);
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
;`

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0 0 15px 0;
  }
;`

const InfoCard = styled.div`
  background: rgba(245,245,245,0.95);
  padding: 20px;
  border-radius: 12px;
  color: #333;
  border: 1px solid rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
;`

const InfoTitle = styled.h4`
  margin: 0 0 12px 0;
  color: #2c5aa0;
  font-size: 16px;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin: 0 0 10px 0;
  }
;`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
;`

const InfoItem = styled.div`
  font-size: 14px;
  color: #555;
  padding: 4px 0;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
;`

const InfoNote = styled.p`
  font-size: 13px;
  color: #666;
  margin: 12px 0 0 0;
  font-style: italic;
  background: rgba(76, 175, 80, 0.1);
  padding: 8px;
  border-radius: 6px;
  
  @media (max-width: 768px) {
    font-size: 11px;
    padding: 6px;
    margin: 10px 0 0 0;
  }
;`

const DataDisplayCard = styled.div`
  background: rgba(44, 97, 44, 0.56);
  padding: 15px;
  border-radius: 12px;
  color: rgb(2, 20, 2);
  font-family: 'Courier New', monospace;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  border: 2px solid #333;
  height: fit-content;
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
  }
;`

const DataDisplayTitle = styled.h4`
  color: rgb(0, 0, 0);
  margin: 0 0 12px 0;
  font-size: 18px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin: 0 0 10px 0;
  }
;`

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 6px 0;
  padding: 4px 8px;
  background: rgba(0,255,0,0.1);
  border-radius: 4px;
  border-left: 2px solid rgb(0, 0, 0);
  
  @media (max-width: 768px) {
    padding: 3px 6px;
    margin: 4px 0;
  }
;`

const DataLabel = styled.span`
  color: black;
  font-size: 12px;
  
  @media (max-width: 768px) {
    font-size: 10px;
  }
;`

const DataValue = styled.span`
  color: rgb(0, 0, 0);
  font-weight: bold;
  font-size: 12px;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
;`

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
;`

const ControlPanel = styled.div`
  background: linear-gradient(135deg, #fffaf0, #fdd9a0); // beige suave
color: #333;
margin-top: -140px;
  padding: 5px;
  gap: 10px;
  width:100%;
  display: grid;
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgb(0, 0, 0),
    inset 0 1px 0 rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.8);
  position: relative;
  min-height: 400px;
  backdrop-filter: blur(10px);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,rgb(115, 180, 250),rgb(155, 196, 7),rgb(255, 139, 7),rgb(167, 0, 0));
    border-radius: 24px 24px 0 0;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    min-height: 400px;
  }
;`

const ControlTitle = styled.h2`
  text-align: center;
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #495057;
  font-weight: 700;
  letter-spacing: -0.5px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #007bff, #28a745);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
  grid-template-columns: repeat(3, 1fr);
    font-size: 20px;
    margin: 0 0 25px 0;
  }
;`

const ModeButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 35px;
  padding: 8px;
  background: rgba(255,255,255,0.7);
  border-radius: 16px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 30px;
  }
;`

const ModeButton = styled.button`
  padding: 1px 4px;
  border: none;
  margin-bottom:-25px;
  margin-top: -5px;
  min-height: 35px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
    : 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(24, 32, 41) 100%)'};
  color: white;
  box-shadow: ${props => props.active 
    ? '0 4px 12px rgba(40, 167, 69, 0.4), 0 2px 4px rgba(0,0,0,0.1)'
    : '0 2px 8px rgba(0,0,0,0.15)'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(32, 4, 4, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${props => props.active 
      ? '0 6px 20px rgba(40, 167, 70, 0.88), 0 4px 8px rgb(0, 0, 0)'
      : '0 4px 16px rgba(0, 0, 0, 0.97)'};
      
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.93);
    }
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 12px;
  }
;`
const ControlSection = styled.div`
  margin-bottom: 20px;
  padding: 7px;
  background: rgba(211, 134, 34, 0.45);
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.disabled 
      ? 'linear-gradient(90deg,rgb(30, 109, 189), #adb5bd)'
      : 'linear-gradient(90deg,rgb(245, 176, 47),rgb(156, 7, 7))'};
    opacity: ${props => props.disabled ? 0.3 : 1};
  }
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)'
      : '0 8px 25px rgba(0, 0, 0, 0.15)'};
  }
  
  ${props => props.disabled && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(1, 7, 12, 0.1);
      backdrop-filter: blur(1px);
      z-index: 1;
    }
  `}
  
  & > * {
    position: relative;
    z-index: 2;
    opacity: ${props => props.disabled ? 0.4 : 1};
    pointer-events: ${props => props.disabled ? 'none' : 'auto'};
    transition: opacity 0.3s ease;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    padding: 16px;
  }
`;

const ControlLabel = styled.h4`
  font-size: 16px;
  margin: 0 0 16px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: #495057;
  gap: 10px;
  font-weight: 600;
  letter-spacing: -0.2px;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin: 0 0 12px 0;
  }
`;

const NumericControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(248,249,250,0.8);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
    padding: 10px;
  }
`;

const NumericButton = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 10px;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,123,255,0.3);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(0,123,255,0.4);
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const NumericInput = styled.input`
  width: 60px;
  padding: 8px;
  text-align: center;
  border: 2px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  background: white;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    transform: scale(1.02);
  }
  
  &:disabled {
    background: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 70px;
    padding: 10px;
    font-size: 14px;
  }
`;

const ControlButton = styled.button`
  padding: 10px;
  font-size: 12px;
  left: 50px;
  right: 50px;
  width: 80px;
  aling-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  background: ${props => props.active ? '#c0392b' : '#27ae60'};
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: ${props => props.active ? '#e74c3c' : '#2ecc71'};
  }
`;

const PowerDisplay = styled.p`
  font-size: 12px;
  margin: 8px 0 0 0;
  text-align: center;
  color: #6c757d;
  font-weight: 500;
  padding: 6px 8px;
  background: rgba(248,249,250,0.8);
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.05);
  
  strong {
    color: #495057;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    padding: 6px 10px;
  }
`;

const ConnectionInfo = styled.div`
  text-align: center;
  color: #000000;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 20px;
  border-radius: 10px;
  font-size: 14px;
  position: fixed;
  bottom: 60px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border: 1px solid rgba(0,0,0,0.1);
  
  strong {
    color: #000000;
  }
  
  @media (max-width: 768px) {
    font-size: 11px;
    padding: 10px 15px;
    bottom: 50px;
    left: 10px;
    right: 10px;
    
    /* Hacer responsive el texto */
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    
    & > * {
      white-space: nowrap;
    }
  }
  
  @media (max-width: 600px) {
    font-size: 10px;
    padding: 8px 12px;
    
    /* En pantallas muy pequeñas, hacer vertical */
    flex-direction: column;
    gap: 2px;
  }
`;

const ToastMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* ✅ centra verticalmente si hay altura extra */
  text-align: center;      /* ✅ centra el texto */
  gap: 5px;
  width: 100%;
`;


const ChartContainer = styled.div`
  height: 300px;
  margin-bottom: 20px;
  width: 100%;
  margin-top: -20px;
  
  @media (max-width: 768px) {
    height: 250px;
    margin-bottom: 15px;
  }
`;

export {
  MainContainer,
  LeftSection,
  TopCards,
  StatusCard,
  StatusTitle,
  StatusValue,
  StatusIcon,
  CycleIcon,
  RightSection,
  ControlPanel,
  ModeButtons,
  ControlSection,
  ControlLabel,
  NumericControl,
  ModeButton,
  ControlTitle,
  NumericButton,
  NumericInput,
  ControlButton,
  PowerDisplay,
  ChartCard,
  ChartTitle,
  ToastContainer,
  ToastMessage,
  ToastTitle,
  ToastSubtitle,
  InfoCard,
  InfoTitle,
  InfoGrid,
  InfoItem,
  InfoNote,
  DataDisplayCard,
  DataDisplayTitle,
  DataRow,
  DataLabel,
  DataValue,
  ControlsGrid,
  PageContainer,
  ChartContainer,
  ContentContainer,
  ChartWithMonitorRow,
  ConnectionInfo,
};