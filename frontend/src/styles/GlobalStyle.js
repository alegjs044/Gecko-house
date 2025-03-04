import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Goudy Bookletter 1911", sans-serif;
  

  body {
    background-color: #f5f0e6;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyles;
