import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';

export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<div>Главная</div>} />
        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
}
