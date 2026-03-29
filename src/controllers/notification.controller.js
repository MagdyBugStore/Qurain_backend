import { Notification } from '../models/index.js';

/**
 * Get user notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit, isRead } = req.query;
    const query = { userId: req.user.id };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      data: { notifications },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
        meta: {},
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: { notification },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: { message: 'All notifications marked as read' },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
