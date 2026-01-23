import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginPage from './pages/LoginPage/LoginPage';

export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        <Route path='/login' element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<div>Главная</div>} />
        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
}
