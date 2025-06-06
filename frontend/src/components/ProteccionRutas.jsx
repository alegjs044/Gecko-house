import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  
  // ✅ VERIFICAR AUTENTICACIÓN
  console.log('🔐 Verificando autenticación:', {
    hasToken: !!token,
    hasUserData: !!userData,
    tokenLength: token?.length
  });
  
  if (!token || !userData) {
    console.log('❌ No autenticado, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }
  
  try {
    const parsedUserData = JSON.parse(userData);
    if (!parsedUserData.ID_usuario) {
      console.log('❌ Datos de usuario inválidos, redirigiendo al login');
      return <Navigate to="/login" replace />;
    }
    
    console.log('✅ Usuario autenticado:', parsedUserData.ID_usuario);
    return children;
  } catch (error) {
    console.error('❌ Error parseando userData:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;