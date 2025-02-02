import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home.js';
import Profile from './pages/Profile.js';
import Orders from './pages/Orders.js';
import DeliverItems from './pages/DeliverItems.js';
import Cart from './pages/Cart.js';
import Login from './pages/login.js';
import Sell from './pages/Sell.js';
import { useAuth } from './context/AuthContext.js';
import Signup from './pages/Signup.js'
import ProtectedRoute from './Components/ProtectedRoute.js';
import Product from './pages/Product.js';
import Chatbot from './pages/chatbot.js';

function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute> <Home /> </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute> <Orders /> </ProtectedRoute>} />
        <Route path="/sell" element={<ProtectedRoute> <Sell /> </ProtectedRoute>} />
        <Route path="/deliver" element={<ProtectedRoute> <DeliverItems /> </ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute> <Cart /> </ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute> <Chatbot /> </ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute> <Product /> </ProtectedRoute>} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Signup />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
      </Routes>
    </Router>
  );
}

export default App;