import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/login";
import Registro from "./pages/registro"; 
import Dashboard from "./pages/dashboard";
import Recuperar from "./pages/recuperar";
import PruebasNotificaciones from "./pages/pruebasNotificaciones";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar/>} />
        <Route path="/registro" element={<Registro />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pruebas_notificaciones" element={<PruebasNotificaciones/>}/>
      </Routes>
    </Router>
  );
}

export default App;
