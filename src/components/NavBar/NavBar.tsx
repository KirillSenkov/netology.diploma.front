import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { selectAuthUser, selectIsAuthenticated } from '../../features/auth/selectors';

export default function NavBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector(selectAuthUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const onLogoutClick = async () => {
    const action = await dispatch(logout());

    if (logout.fulfilled.match(action)) {
      navigate('/login');
    }
  };

  return (
    <header className='nav'>
      <div className='nav__inner'>
        <div className='nav__left'>
          <Link className='nav__brand' to='/'>
            My Cloud
          </Link>
        </div>
        <nav className='nav__right'>
          {!isAuthenticated && (
            <>
              <Link className='nav__link' to='/login'>
                Вход
              </Link>
              <Link className='nav__link' to='/register'>
                Регистрация
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <span className='nav__user'>{user?.username}</span>
              <button className='nav__button' type='button' onClick={onLogoutClick}>
                Выход
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
