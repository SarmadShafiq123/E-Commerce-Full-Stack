import { Link } from 'react-router-dom';

const FooterLink = ({ to, label }) => (
  <Link to={to} className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
    {label}
  </Link>
);

const Footer = () => (
  <footer className="bg-white border-t border-[#EAEAEA] mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A] mb-3">Luxe Bags</p>
          <p className="text-sm text-[#6B7280] leading-relaxed max-w-[200px]">
            Timeless elegance, handcrafted with care.
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-4">Shop</p>
          <div className="flex flex-col gap-3">
            <FooterLink to="/products" label="All Products" />
            <FooterLink to="/products?category=handbags" label="Handbags" />
            <FooterLink to="/products?category=tote-bags" label="Tote Bags" />
            <FooterLink to="/products?category=clutches" label="Clutches" />
          </div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-4">Account</p>
          <div className="flex flex-col gap-3">
            <FooterLink to="/profile" label="Profile" />
            <FooterLink to="/orders" label="Orders" />
            <FooterLink to="/wishlist" label="Wishlist" />
          </div>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-4">Info</p>
          <div className="flex flex-col gap-3">
            <FooterLink to="/products" label="Collections" />
          </div>
        </div>
      </div>
      <div className="border-t border-[#EAEAEA] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[#6B7280]">
          © {new Date().getFullYear()} Luxe Bags. All rights reserved.
        </p>
        <p className="text-xs text-[#6B7280]">Crafted with care.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
