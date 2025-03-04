import React from "react";
import styled from "styled-components";

const ButtonStyled = styled.button`
  background-color: #5a9e67;
  color: white;
  border: none;
  padding: 10px;
  width: 100%;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;

  &:hover {
    background-color: #4b8757;
  }
`;

const Button = ({ text, onClick }) => {
  return <ButtonStyled onClick={onClick}>{text}</ButtonStyled>;
};

export default Button;
