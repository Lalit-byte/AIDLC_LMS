import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseList from '../features/courses/CourseList';
import CourseDetails from '../features/courses/CourseDetails';
import Dashboard from '../features/dashboard/Dashboard';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/studio"
              element={
                <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                  <h1>Instructor Studio</h1>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Course authoring, section/lesson management, and review submissions.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
