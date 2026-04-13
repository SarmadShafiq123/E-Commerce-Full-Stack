import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import PageSEO from '../seo/PageSEO';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
    />
  </div>
);

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/';
  const googleError = searchParams.get('error');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setNeedsVerification(false); setLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      login({ id: data.data.id, name: data.data.name, email: data.data.email, role: data.data.role });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('verify your email')) {
        setNeedsVerification(true);
        setResendEmail(formData.email);
      }
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true); setResendMessage('');
    try {
      await authAPI.resendVerification(resendEmail);
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const googleAuthURL = `${import.meta.env.VITE_API_URL}/auth/google`;

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4 py-16">
      <PageSEO title="Sign In" description="Sign in to your Luxe Bags account to track orders, manage your wishlist and more." noIndex={true} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
            Luxe Bags
          </Link>
          <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mt-4 mb-1">Welcome back</h1>
          <p className="text-sm text-[#6B7280]">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8">
          {googleError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2.5 rounded-xl mb-4">
              Google sign-in failed. Please try again.
            </p>
          )}

          <a
            href={googleAuthURL}
            className="flex items-center justify-center gap-3 w-full py-3 border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] hover:bg-[#FAFAFA] transition duration-300 mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#EAEAEA]" />
            <span className="text-xs text-[#6B7280]">or</span>
            <div className="flex-1 h-px bg-[#EAEAEA]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
            <InputField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />

            {error && (
              <div className="text-xs text-red-500 bg-red-50 px-3 py-2.5 rounded-xl">
                <p>{error}</p>
                {needsVerification && (
                  <div className="mt-3 pt-3 border-t border-red-100">
                    <p className="text-[#6B7280] mb-2">Resend verification email?</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[#EAEAEA] rounded-lg text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Email"
                      />
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs rounded-lg disabled:opacity-50"
                      >
                        {resendLoading ? '...' : 'Send'}
                      </button>
                    </div>
                    {resendMessage && <p className="mt-1.5 text-green-600">{resendMessage}</p>}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1A1A1A] hover:underline underline-offset-4 transition duration-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
