import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home.js';
import Profile from './pages/Profile.js';
import Orders from './pages/orders.js';
import DeliverItems from './pages/DeliverItems.js';
import Cart from './pages/Cart.js';
import Login from './pages/login.js';
import { useAuth } from './context/AuthContext.js';
import Signup from './pages/Signup.js'
import ProtectedRoute from './Components/ProtectedRoute.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deliver"
          element={
            <ProtectedRoute>
              <DeliverItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;