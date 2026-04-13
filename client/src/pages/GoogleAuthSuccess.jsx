import { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');

    if (id) {
      // Token is already set as httpOnly cookie by the server redirect
      login({ id, name, email, role });
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-[#EAEAEA] border-t-[#1A1A1A] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6B7280]">Signing you in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
