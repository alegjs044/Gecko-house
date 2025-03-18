import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register"; 
import Dashboard from "./pages/dashboard";
import Recuperar from "./pages/recuperar";
import PruebasNotificaciones from "./pages/pruebasNotificaciones";
import Historial from "./pages/historial";
import Edit_User from "./pages/editar-usuario";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar/>} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pruebas_notificaciones" element={<PruebasNotificaciones/>} />
        <Route path="/historial" element={<Historial/>} />
        <Route path="/editar-datos" element={<Edit_User/>}/>
      </Routes>
    </Router>
  );
}

export default App;
