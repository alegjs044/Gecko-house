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
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  &:hover {
    background-color: #4b8757;
  }
`;

const Button = ({ text, onClick, type = "button", disabled = false }) => {
  return (
    <ButtonStyled onClick={onClick} type={type} disabled={disabled}>
      {text}
    </ButtonStyled>
  );
};

export default Button;
