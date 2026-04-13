import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        if (!isMounted) return;
        if (res.data.alreadyVerified) { navigate('/', { replace: true }); return; }
        if (res.data.data) {
          const { id, name, email, role } = res.data.data;
          login({ id, name, email, role });
          setStatus('success');
          setTimeout(() => navigate('/', { replace: true }), 2000);
        } else {
          setStatus('success');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(error.response?.data?.message || 'This verification link has expired or already been used.');
        }
      }
    };
    if (token) verifyToken();
    return () => { isMounted = false; };
  }, [token, navigate, login]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;
    setResendLoading(true); setResendMessage(''); setResendError('');
    try {
      await authAPI.resendVerification(email);
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        {status === 'loading' && <Spinner />}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mb-2">Email Verified</h1>
            <p className="text-sm text-[#6B7280] mb-4">Your account is ready. Redirecting...</p>
            <Link to="/login" className="text-xs text-[#6B7280] hover:text-[#1A1A1A] underline underline-offset-4 transition duration-300">
              Go to login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mb-2">Link Expired</h1>
            <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">{errorMessage}</p>

            <div className="bg-white rounded-2xl p-6 text-left">
              <p className="text-xs tracking-widest uppercase text-[#1A1A1A] mb-4 text-center">Resend Verification</p>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                  placeholder="Your registered email"
                  required
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Email'}
                </button>
              </form>
              {resendMessage && <p className="text-xs text-green-600 mt-3 text-center">{resendMessage}</p>}
              {resendError && <p className="text-xs text-red-500 mt-3 text-center">{resendError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
