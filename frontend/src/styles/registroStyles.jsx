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

const RegisterBox = styled.div`
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

const Label = styled.label`
  display: block;
  margin: 10px 0 5px;
  font-weight: bold;
  color: black;
`;

const LoginLink = styled.a`
  display: block;
  margin-top: 10px;
  color: blue;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
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
  right: 70%;
  width: 200px;
`;

export {
    Container,
    Title,
    RegisterBox,
    StyledGecko,
    LoginLink,
    Label,
    StyledPlanta
};