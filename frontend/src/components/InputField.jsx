import React from "react";
import styled from "styled-components";

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
`;

const InputField = ({ type, placeholder, value, onChange }) => {
  return <Input type={type} placeholder={placeholder} value={value} onChange={onChange} />;
};

export default InputField;
