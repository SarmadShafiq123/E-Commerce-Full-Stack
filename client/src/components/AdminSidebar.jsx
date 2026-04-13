import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import NotificationBell from './NotificationBell';

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    adminAPI.getLowStockAlerts()
      .then(({ data }) => setLowStockCount(data.count || 0))
      .catch(() => {});
    adminAPI.getAllReviews({ status: 'pending' })
      .then(({ data }) => setPendingReviews(data.data?.length || 0))
      .catch(() => {});
  }, [pathname]);

  const links = [
    { to: '/admin/dashboard',  label: 'Dashboard' },
    { to: '/admin/products',   label: 'Products' },
    { to: '/admin/inventory',  label: 'Inventory', badge: lowStockCount },
    { to: '/admin/orders',     label: 'Orders' },
    { to: '/admin/coupons',    label: 'Coupons' },
    { to: '/admin/offers',     label: 'Offers' },
    { to: '/admin/reviews',    label: 'Reviews', badge: pendingReviews },
    { to: '/admin/ai',         label: 'AI Analytics' },
    { to: '/admin/chatbot',    label: 'Chatbot' },
    { to: '/admin/homepage',   label: 'Homepage CMS' },
  ];

  return (
    <aside className="w-48 shrink-0 hidden md:block">
      <div className="sticky top-24 space-y-1">
        <div className="flex items-center justify-between mb-4 px-3">
          <p className="text-[10px] tracking-widest uppercase text-[#6B7280]">Admin</p>
          <NotificationBell />
        </div>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition duration-300 ${
              pathname === l.to
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]'
            }`}
          >
            <span>{l.label}</span>
            {l.badge > 0 && (
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none ${
                pathname === l.to ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'
              }`}>
                {l.badge > 99 ? '99+' : l.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default AdminSidebar;
