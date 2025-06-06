import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; 

import ProtectedRoute from "./components/ProteccionRutas";

import Home from "./pages/Home";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Recuperar from "./pages/recuperar";
import Historial from "./pages/historial";
import EditUser from "./pages/editar-usuario";
import ResetPassword from "./pages/resetpassword";
import Personalizar from "./pages/cuenta_personalizada";
import FAQ from "./pages/FAQ";

function SessionValidator() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          console.log("🕐 Token expirado, redirigiendo al login");
          localStorage.removeItem("token");
          localStorage.removeItem("userData"); // ✅ Limpiar también userData
          navigate("/login");
        } else {
          console.log("✅ Token válido, expira en:", new Date(decoded.exp * 1000));
        }
      } catch (err) {
        console.error("❌ Token inválido o corrupto:", err.message);
        localStorage.removeItem("token");
        localStorage.removeItem("userData"); // ✅ Limpiar también userData
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
        {/* ✅ RUTAS PÚBLICAS (no requieren autenticación) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/faq" element={<FAQ />} />
        
        {/* ✅ RUTAS PROTEGIDAS (requieren autenticación) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/historial" 
          element={
            <ProtectedRoute>
              <Historial />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/editar-datos" 
          element={
            <ProtectedRoute>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/personalizar" 
          element={
            <ProtectedRoute>
              <Personalizar />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;