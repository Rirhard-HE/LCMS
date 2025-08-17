import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Cases from './pages/Cases';
import Evidence from './pages/Evidence';
import { AuthProvider } from './context/AuthContext';
import './App.css';

export default function App() {
  console.log('APP_LOADED'); 
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/evidence" element={<Evidence />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
