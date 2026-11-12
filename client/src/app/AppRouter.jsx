import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CourseList from '../features/courses/CourseList';
import CourseDetails from '../features/courses/CourseDetails';
import LessonPlayer from '../features/lessons/LessonPlayer';
import Dashboard from '../features/dashboard/Dashboard';
import InstructorStudio from '../features/studio/InstructorStudio';
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
            <Route path="/learn/:courseId" element={<LessonPlayer />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<InstructorStudio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
