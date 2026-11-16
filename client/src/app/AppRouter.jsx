import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseList from '../features/courses/CourseList';
import CourseDetails from '../features/courses/CourseDetails';
import LessonPlayer from '../features/lessons/LessonPlayer';
import Dashboard from '../features/dashboard/Dashboard';
import InstructorStudio from '../features/studio/InstructorStudio';
import AdminDashboard from '../features/admin/AdminDashboard';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<CourseList showHero={true} />} />
              <Route path="/courses" element={<CourseList showHero={false} />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/learn/:courseId" element={<LessonPlayer />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/studio" element={<InstructorStudio />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
