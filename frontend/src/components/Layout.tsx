import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { getNotifications, markOneRead, markAllRead } from '../api/notifications';

let notifSocket: Socket | null = null;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, setNotifications, addNotification, markRead, markAllRead: markAllReadLocal } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch existing notifications and connect socket on mount
  useEffect(() => {
    if (!token || !user) return;

    getNotifications().then(setNotifications).catch(() => {});

    notifSocket = io('http://localhost:5000', { auth: { token } });
    notifSocket.on('notification', (n) => addNotification(n));

    return () => {
      notifSocket?.disconnect();
      notifSocket = null;
    };
  }, [token, user?.id]);

  // Close dropdown when clicking outside
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
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">FreelanceHub</Link>
        <div className="flex items-center gap-6 text-sm">
          {user?.role === 'CLIENT' && (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
              <Link to="/my-projects" className="text-gray-600 hover:text-indigo-600">My Projects</Link>
              <Link to="/create-project" className="text-gray-600 hover:text-indigo-600">+ Post Project</Link>
            </>
          )}
          {user?.role === 'FREELANCER' && (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
              <Link to="/projects" className="text-gray-600 hover:text-indigo-600">Browse Projects</Link>
              <Link to="/my-bids" className="text-gray-600 hover:text-indigo-600">My Bids</Link>
            </>
          )}
          {user && (
            <Link to={`/profile/${user.id}`} className="text-gray-600 hover:text-indigo-600">My Profile</Link>
          )}
          <span className="text-gray-400">|</span>

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAll} className="text-xs text-indigo-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.isRead ? 'opacity-60' : 'bg-indigo-50/40'}`}
                      >
                        <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                        {!n.isRead && (
                          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-gray-700 font-medium">{user?.name}</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{user?.role}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
