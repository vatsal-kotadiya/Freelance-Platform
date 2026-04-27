import { NotificationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { getIo } from '../lib/io';

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  relatedId?: string
) {
  const notification = await prisma.notification.create({
    data: { userId, type, message, relatedId },
  });

  const io = getIo();
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }

  return notification;
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function markOneRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
