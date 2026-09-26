import * as chatService from "../services/chat.service.js";

export const isUserInRoom = (io, roomId, userId) => {
  if (!io || !roomId || !userId) return false;
  const roomSockets = io.sockets?.adapter?.rooms?.get(roomId);
  if (!roomSockets || roomSockets.size === 0) return false;

  const targetUserId = userId.toString();
  for (const socketId of roomSockets) {
    const s = io.sockets?.sockets?.get?.(socketId);
    if (s && s.userId && s.userId.toString() === targetUserId) {
      return true;
    }
  }
  return false;
};

export const registerChatSocketHandlers = (io, socket) => {
  const userId = socket.userId;
  const userRole = socket.userRole;

  const handleJoinThread = async (data = {}, callback) => {
    const { threadId } = data;
    const ack = typeof callback === "function" ? callback : null;

    try {
      const auth = await chatService.authorizeThreadAccess({
        threadId,
        userId,
        userRole,
      });

      if (!auth.authorized) {
        const errorPayload = {
          success: false,
          threadId,
          error: auth.message || "Unauthorized to join thread room",
          reason: auth.reason || "FORBIDDEN",
        };
        if (ack) ack(errorPayload);
        socket.emit("chat_error", errorPayload);
        return;
      }

      const roomName = `thread:${threadId}`;
      socket.join(roomName);

      const deliveredResult = await chatService.markMessagesDelivered({
        threadId,
        userId,
      });

      if (deliveredResult.messageIds.length > 0) {
        io.to(roomName).emit("messages_delivered", {
          threadId,
          messageIds: deliveredResult.messageIds,
          deliveredAt: deliveredResult.deliveredAt,
        });
      }

      const unreadCount = await chatService.getUnreadCount({
        threadId,
        userId,
      });

      const responsePayload = {
        success: true,
        threadId,
        unreadCount,
      };

      if (ack) ack(responsePayload);
      socket.emit("thread_joined", responsePayload);
    } catch (error) {
      const errorPayload = {
        success: false,
        threadId,
        error: error.message || "Failed to join thread",
      };
      if (ack) ack(errorPayload);
      socket.emit("chat_error", errorPayload);
    }
  };

  socket.on("join_thread", handleJoinThread);
  socket.on("join_room", handleJoinThread);

  const handleLeaveThread = (data = {}, callback) => {
    const { threadId } = data;
    const ack = typeof callback === "function" ? callback : null;

    if (threadId) {
      const roomName = `thread:${threadId}`;
      socket.leave(roomName);
    }

    const responsePayload = { success: true, threadId };
    if (ack) ack(responsePayload);
    socket.emit("thread_left", responsePayload);
  };

  socket.on("leave_thread", handleLeaveThread);
  socket.on("leave_room", handleLeaveThread);

  socket.on("send_message", async (data = {}, callback) => {
    const {
      threadId,
      content,
      messageType,
      attachments,
      clientMessageId,
    } = data;
    const ack = typeof callback === "function" ? callback : null;

    try {
      const auth = await chatService.authorizeThreadAccess({
        threadId,
        userId,
        userRole,
      });

      if (!auth.authorized) {
        const errorPayload = {
          success: false,
          clientMessageId,
          threadId,
          error: auth.message,
          reason: auth.reason,
        };
        if (ack) ack(errorPayload);
        socket.emit("chat_error", errorPayload);
        return;
      }

      const roomName = `thread:${threadId}`;
      const peerId = auth.peerId?.toString();

      const isRecipientInRoom = isUserInRoom(io, roomName, peerId);

      const message = await chatService.saveMessage({
        threadId,
        senderId: userId,
        content,
        messageType,
        attachments,
        isDelivered: isRecipientInRoom,
      });

      const messageObj = message.toObject ? message.toObject() : message;
      const broadcastPayload = {
        ...messageObj,
        clientMessageId,
      };

      io.to(roomName).emit("receive_message", broadcastPayload);
      io.to(roomName).emit("new_message", broadcastPayload);

      if (isRecipientInRoom) {
        io.to(roomName).emit("messages_delivered", {
          threadId,
          messageIds: [message._id.toString()],
          deliveredAt: message.deliveredAt,
        });
      } else if (peerId) {
        const unreadCount = await chatService.getUnreadCount({
          threadId,
          userId: peerId,
        });

        io.to(`user:${peerId}`).emit("chat_notification", {
          threadId,
          messageId: message._id,
          senderId: userId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          unreadCount,
        });

        io.to(`user:${peerId}`).emit("unread_count_update", {
          threadId,
          unreadCount,
        });
      }

      const responsePayload = {
        success: true,
        message: broadcastPayload,
        clientMessageId,
      };
      if (ack) ack(responsePayload);
    } catch (error) {
      const errorPayload = {
        success: false,
        clientMessageId,
        threadId,
        error: error.message || "Failed to send message",
        reason: error.reason || "SEND_FAILED",
      };
      if (ack) ack(errorPayload);
      socket.emit("chat_error", errorPayload);
    }
  });

  socket.on("mark_delivered", async (data = {}, callback) => {
    const { threadId, messageIds } = data;
    const ack = typeof callback === "function" ? callback : null;

    try {
      const result = await chatService.markMessagesDelivered({
        threadId,
        userId,
        messageIds,
      });

      if (result.messageIds.length > 0) {
        io.to(`thread:${threadId}`).emit("messages_delivered", {
          threadId,
          messageIds: result.messageIds,
          deliveredAt: result.deliveredAt,
        });
      }

      const responsePayload = {
        success: true,
        threadId,
        messageIds: result.messageIds,
        deliveredAt: result.deliveredAt,
      };
      if (ack) ack(responsePayload);
    } catch (error) {
      const errorPayload = {
        success: false,
        threadId,
        error: error.message || "Failed to mark messages delivered",
      };
      if (ack) ack(errorPayload);
      socket.emit("chat_error", errorPayload);
    }
  });

  socket.on("mark_read", async (data = {}, callback) => {
    const { threadId, messageIds } = data;
    const ack = typeof callback === "function" ? callback : null;

    try {
      const result = await chatService.markMessagesRead({
        threadId,
        userId,
        messageIds,
      });

      if (result.messageIds.length > 0) {
        io.to(`thread:${threadId}`).emit("messages_read", {
          threadId,
          messageIds: result.messageIds,
          readAt: result.readAt,
        });
      }

      io.to(`user:${userId}`).emit("unread_count_update", {
        threadId,
        unreadCount: result.unreadCount,
      });

      const responsePayload = {
        success: true,
        threadId,
        messageIds: result.messageIds,
        readAt: result.readAt,
        unreadCount: result.unreadCount,
      };
      if (ack) ack(responsePayload);
    } catch (error) {
      const errorPayload = {
        success: false,
        threadId,
        error: error.message || "Failed to mark messages read",
      };
      if (ack) ack(errorPayload);
      socket.emit("chat_error", errorPayload);
    }
  });

  socket.on("get_unread_count", async (data = {}, callback) => {
    const { threadId } = data;
    const ack = typeof callback === "function" ? callback : null;

    try {
      if (threadId) {
        const unreadCount = await chatService.getUnreadCount({
          threadId,
          userId,
        });
        const payload = { success: true, threadId, unreadCount };
        if (ack) ack(payload);
        socket.emit("unread_count", payload);
      } else {
        const unreadData = await chatService.getUserUnreadCounts(userId);
        const payload = { success: true, ...unreadData };
        if (ack) ack(payload);
        socket.emit("unread_count", payload);
      }
    } catch (error) {
      const errorPayload = {
        success: false,
        error: error.message || "Failed to fetch unread count",
      };
      if (ack) ack(errorPayload);
      socket.emit("chat_error", errorPayload);
    }
  });

  socket.on("typing_start", (data = {}) => {
    const { threadId } = data;
    if (threadId) {
      socket.to(`thread:${threadId}`).emit("typing_start", {
        threadId,
        userId,
      });
    }
  });

  socket.on("typing_stop", (data = {}) => {
    const { threadId } = data;
    if (threadId) {
      socket.to(`thread:${threadId}`).emit("typing_stop", {
        threadId,
        userId,
      });
    }
  });
};
