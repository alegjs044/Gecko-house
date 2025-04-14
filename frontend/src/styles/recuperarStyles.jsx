import styled from "styled-components";

const Container = styled.div`
  padding-top: ${(props) => props.headerHeight + 40}px;
  padding-left: 40px;
  padding-right: 40px;
  padding-bottom: 75px;
  background: white;
  border-radius: 20px;
  width: 80%;
  max-width: 500px;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Box = styled.div`
  background: linear-gradient(90deg, rgba(239,191,134,0.51) 0%, rgba(236,137,19,0.5) 51%, rgba(239,191,134,0.5) 100%);
  padding: 30px;
  border-radius: 30px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 90%;
`;

const Title = styled.h2`
  color: black;
  margin-bottom: 15px;
`;

const StyledGecko = styled.img`
  position: absolute;
  top: 14%;
  left: 76%;
  width: 250px;
  filter: brightness(50%);
`;

const StyledPlanta = styled.img`
  position: absolute;
  bottom: 1%;
  right: 80%;
  width: 200px;
`;

const Message = styled.p`
  margin-top: 10px;
  font-size: 14px;
  color: ${({ success }) => (success ? "green" : "red")};
`;

export {
    Container,
    Title,
    Message,
    Box,
    StyledGecko,
    StyledPlanta,
};
