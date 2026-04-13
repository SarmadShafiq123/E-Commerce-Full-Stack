import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';

const typeIcon = {
  low_stock:   '📦',
  new_review:  '⭐',
  new_order:   '🛍️',
  order_status:'🚚',
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const ref = useRef(null);

  const fetch = async () => {
    try {
      const { data } = await adminAPI.getNotifications();
      setNotifications(data.data);
      setUnread(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    await adminAPI.markAllRead();
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await adminAPI.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      await adminAPI.markAllRead().catch(() => {});
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full border border-[#EAEAEA] text-[#1A1A1A] hover:bg-[#FAFAFA] transition duration-300"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-medium rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#EAEAEA] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]">
            <p className="text-xs font-medium text-[#1A1A1A] tracking-wide">Notifications</p>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-[10px] text-[#6B7280] hover:text-[#1A1A1A] transition duration-300 tracking-wide">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#EAEAEA]">
            {notifications.length === 0 ? (
              <p className="text-xs text-[#6B7280] text-center py-8">No notifications</p>
            ) : notifications.map((n) => (
              <div key={n._id} className={`flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition duration-300 ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                <span className="text-base shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1A1A] leading-snug">{n.title}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-[#9CA3AF] mt-1">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={(e) => handleDelete(n._id, e)} className="text-[#9CA3AF] hover:text-red-400 transition duration-300 shrink-0 text-sm leading-none mt-0.5">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
