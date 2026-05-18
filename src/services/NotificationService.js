import api from "./api";

export const NotificationService = {
  fetchNotificationList: async function (userId) {
    return api.get(`/notifications/list?userId=${userId}`);
  },

  markNotificationRead: async function (notificationId, userId) {
    return api.put('/notifications/MarkRead', {
      notificationId: notificationId,
      userId: userId,
      isRead: true
    });
  },

  markAllNotificationsRead: async function (userId) {
    return api.put('/notifications/MarkAllRead', {
      userId: userId,
      isRead: true
    });
  },
};
