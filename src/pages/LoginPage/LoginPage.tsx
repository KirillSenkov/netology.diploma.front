import { useEffect, useState } from 'react';
import './LoginPage.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, resetAuthError } from '../../features/auth/authSlice';
import { selectAuthError, selectAuthStatus, selectIsAuthenticated } from '../../features/auth/selectors';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(resetAuthError());

    await dispatch(
      login({
        username: username.trim(),
        password: password,
      })
    );
  };

  const isLoading = status === 'loading';

  return (
    <div className='login'>
      <h1 className='login__title'>Вход</h1>

      <form className='login__form' onSubmit={onSubmit}>
        <label className='login__label'>
          Логин
          <input
            className='login__input'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete='username'
          />
        </label>

        <label className='login__label'>
          Пароль
          <input
            className='login__input'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='current-password'
          />
        </label>

        <button className='login__button' type='submit' disabled={isLoading}>
          {isLoading ? 'Вход…' : 'Войти'}
        </button>

        {error && <div className='login__error'>{error}</div>}
      </form>
    </div>
  );
}
