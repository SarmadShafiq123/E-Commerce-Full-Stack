import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.register(formData);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMessage('');
    try {
      await authAPI.resendVerification(formData.email);
      setResendMessage('Verification email resent. Check your inbox.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F5F5F5]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mb-2">Check your inbox</h1>
          <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
            We sent a verification link to <span className="text-[#1A1A1A]">{formData.email}</span>. Click it to activate your account. Link expires in 24 hours.
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full py-3 border border-[#EAEAEA] text-sm text-[#1A1A1A] rounded-full hover:bg-white transition duration-300 disabled:opacity-50 mb-3"
          >
            {resendLoading ? 'Sending...' : 'Resend Email'}
          </button>
          {resendMessage && <p className="text-xs text-green-600 mb-4">{resendMessage}</p>}
          <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const googleAuthURL = `${import.meta.env.VITE_API_URL}/auth/google`;

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4 py-16">
      <PageSEO title="Create Account" description="Join Luxe Bags — create your account to shop premium handcrafted leather bags." noIndex={true} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
            Luxe Bags
          </Link>
          <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mt-4 mb-1">Create account</h1>
          <p className="text-sm text-[#6B7280]">Join the Luxe Bags community</p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8">
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
            <InputField label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" />
            <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
            <InputField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min. 8 characters" />

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2.5 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1A1A1A] hover:underline underline-offset-4 transition duration-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
