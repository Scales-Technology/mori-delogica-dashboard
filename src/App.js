import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import ViewRecords from './pages/ViewRecords';
import ManageLocations from './pages/ManageLocations';
import ManageUsers from './pages/ManageUsers';
import Login from './pages/Login';
import { auth } from './config/firebase';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/view-records" element={<ViewRecords />} />
                  <Route path="/manage-locations" element={<ManageLocations />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;