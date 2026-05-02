import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getNotifications, markOneRead, markAllRead } from '../api/notifications';

let notifSocket: Socket | null = null;

export default function Layout({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  function navClass(path: string) {
    const isActive = location.pathname === path;
    return isActive
      ? 'text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full font-medium transition-colors'
      : 'text-gray-500 hover:text-orange-500 px-3 py-1.5 rounded-full font-medium transition-colors hover:bg-orange-50';
  }
  const { notifications, setNotifications, addNotification, markRead, markAllRead: markAllReadLocal } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!token || !user) return;
    getNotifications().then(setNotifications).catch(() => {});
    notifSocket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { auth: { token } });
    notifSocket.on('notification', (n) => addNotification(n));
    return () => {
      notifSocket?.disconnect();
      notifSocket = null;
    };
  }, [token, user?.id]);

  // Reset any global body styles a previous page may have left behind
  // (e.g. overflow:hidden from the image lightbox, or a Razorpay backdrop on navigation)
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';

    // Remove any stray Razorpay iframe / backdrop injected into <body>
    document.querySelectorAll('[id^="razorpay"], [class^="razorpay"]').forEach((el) => el.remove());
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleMarkOne(id: string) {
    markRead(id);
    await markOneRead(id).catch(() => {});
  }

  function getNotificationPath(type: string, relatedId?: string): string | null {
    if (!relatedId) return null;
    if (type === 'NEW_MESSAGE') return `/projects/${relatedId}?tab=chat`;
    return `/projects/${relatedId}`;
  }

  async function handleNotificationClick(n: { id: string; type: string; isRead: boolean; relatedId?: string }) {
    if (!n.isRead) await handleMarkOne(n.id);
    const path = getNotificationPath(n.type, n.relatedId);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  }

  async function handleMarkAll() {
    markAllReadLocal();
    await markAllRead().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        {/* Logo */}
        <Link to="/dashboard" className="text-xl font-extrabold text-gray-900 tracking-tight">
          FreelanceHub<span className="text-orange-500">.</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 text-sm font-medium">
          {user?.role === 'CLIENT' && (
            <>
              <Link to="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
              <Link to="/my-projects" className={navClass('/my-projects')}>My Projects</Link>
              <Link to="/create-project" className={navClass('/create-project')}>Post a Project</Link>
            </>
          )}
          {user?.role === 'FREELANCER' && (
            <>
              <Link to="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
              <Link to="/projects" className={navClass('/projects')}>Browse Projects</Link>
              <Link to="/my-bids" className={navClass('/my-bids')}>My Bids</Link>
            </>
          )}
          {user && (
            <Link to={`/profile/${user.id}`} className={navClass(`/profile/${user.id}`)}>Profile</Link>
          )}
        </div>

        {/* Right side: bell + user + logout */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className={`relative p-2 rounded-full transition-colors focus:outline-none ${open ? 'text-orange-500 bg-orange-50' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAll} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.isRead ? 'opacity-60' : 'bg-orange-50/30'}`}
                      >
                        <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        {!n.isRead && (
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-600">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 leading-tight capitalize">{user?.role === 'CLIENT' ? 'freelancer' : 'client'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className={wide ? 'max-w-7xl mx-auto px-6 py-8' : 'max-w-5xl mx-auto px-6 py-8'}>{children}</main>
    </div>
  );
}
