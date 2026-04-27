import { create } from 'zustand';

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (n) =>
    set((state) => ({ notifications: [n, ...state.notifications] })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
}));
