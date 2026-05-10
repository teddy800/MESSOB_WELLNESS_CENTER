import { prisma } from "../config/prisma";
import { NotificationType, NotificationSeverity } from "../generated/prisma";

export class NotificationService {
  /**
   * Create a notification for an admin
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    severity: NotificationSeverity,
    title: string,
    message: string,
    relatedId?: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        severity,
        title,
        message,
        relatedId,
      },
    });
  }

  /**
   * Get unread notifications count for a user
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Get notifications for a user with optional filtering
   */
  static async getNotifications(
    userId: string,
    filters?: {
      type?: NotificationType;
      severity?: NotificationSeverity;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const where: any = { userId };
    if (filters?.type) where.type = filters.type;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, limit, offset };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteReadNotifications(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }
}
