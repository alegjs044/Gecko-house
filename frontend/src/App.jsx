import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 


import Home from "./pages/Home";
import Login from "./pages/login";
import Registro from "./pages/registro"; 
import Dashboard from "./pages/dashboard";
import Recuperar from "./pages/recuperar";
import Historial from "./pages/historial";
import EditUser from "./pages/editar-usuario";
import ResetPassword from "./pages/resetpassword";

function SessionValidator() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        console.error("❌ Token inválido o corrupto:", err.message);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <SessionValidator />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/registro" element={<Registro />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/editar-datos" element={<EditUser />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
