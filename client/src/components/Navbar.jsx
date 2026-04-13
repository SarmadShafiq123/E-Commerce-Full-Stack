import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const { wishlistIds } = useContext(WishlistContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const wishlistCount = wishlistIds ? wishlistIds.size : 0;
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-[#EAEAEA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A] shrink-0"
          >
            Luxe Bags
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" label="Home" current={location.pathname} />
            <NavLink to="/products" label="Collections" current={location.pathname} />
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-5">
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to="/profile" className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                Login
              </Link>
            )}

            <Link to="/wishlist" aria-label="Wishlist" className="relative text-[#1A1A1A] hover:text-[#6B7280] transition duration-300">
              <HeartIcon />
              {wishlistCount > 0 && <Badge count={wishlistCount} />}
            </Link>

            <Link to="/cart" aria-label="Cart" className="relative text-[#1A1A1A] hover:text-[#6B7280] transition duration-300">
              <BagIcon />
              {cartCount > 0 && <Badge count={cartCount} />}
            </Link>
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/wishlist" aria-label="Wishlist" className="relative text-[#1A1A1A]">
              <HeartIcon />
              {wishlistCount > 0 && <Badge count={wishlistCount} />}
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative text-[#1A1A1A]">
              <BagIcon />
              {cartCount > 0 && <Badge count={cartCount} />}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
            >
              <span className={`block w-5 h-px bg-[#1A1A1A] transition duration-300 ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`block w-5 h-px bg-[#1A1A1A] transition duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-px bg-[#1A1A1A] transition duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#EAEAEA] px-4 py-6 flex flex-col gap-5">
          <MobileLink to="/" label="Home" onClick={close} />
          <MobileLink to="/products" label="Collections" onClick={close} />
          {user?.role === 'admin' && <MobileLink to="/admin/dashboard" label="Admin" onClick={close} />}
          {user ? (
            <>
              <MobileLink to="/profile" label="Profile" onClick={close} />
              <MobileLink to="/orders" label="Orders" onClick={close} />
              <button
                onClick={handleLogout}
                className="text-left text-sm text-[#6B7280] tracking-wide"
              >
                Logout
              </button>
            </>
          ) : (
            <MobileLink to="/login" label="Login" onClick={close} />
          )}
        </div>
      )}
    </header>
  );
};

const NavLink = ({ to, label, current }) => (
  <Link
    to={to}
    className={`text-xs tracking-widest uppercase transition duration-300 ${
      current === to ? 'text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#1A1A1A]'
    }`}
  >
    {label}
  </Link>
);

const MobileLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="text-sm text-[#1A1A1A] tracking-wide"
  >
    {label}
  </Link>
);

const Badge = ({ count }) => (
  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1A1A1A] text-white text-[9px] font-medium rounded-full flex items-center justify-center leading-none">
    {count > 9 ? '9+' : count}
  </span>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const BagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
);

export default Navbar;
