import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { userAPI } from '../services/api';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', phone: '', street: '', city: '', province: '', postalCode: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => setFormData({
        name: data.data.name,
        phone: data.data.phone || '',
        street: data.data.address?.street || '',
        city: data.data.address?.city || '',
        province: data.data.address?.province || '',
        postalCode: data.data.address?.postalCode || '',
      }))
      .catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const { data } = await userAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: { street: formData.street, city: formData.city, province: formData.province, postalCode: formData.postalCode },
      });
      updateUser(data.data);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Account</p>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">My Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-lg font-light">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">{user?.name}</p>
            <p className="text-xs text-[#6B7280]">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6">
            <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Personal Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" />
              <InputField label="Email" type="email" value={user?.email || ''} disabled placeholder="Email" />
              <div className="sm:col-span-2">
                <InputField label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 300 0000000" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Shipping Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Street Address" type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Street, area" />
              </div>
              <InputField label="City" type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
              <InputField label="Province" type="text" name="province" value={formData.province} onChange={handleChange} placeholder="Province" />
              <InputField label="Postal Code" type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Postal code" />
            </div>
          </div>

          {message && (
            <p className="text-xs text-green-600 bg-green-50 px-4 py-3 rounded-xl">{message}</p>
          )}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
