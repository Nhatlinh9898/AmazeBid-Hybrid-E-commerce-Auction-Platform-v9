import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from '../App';
import DashboardApp from './App';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<DashboardApp />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
