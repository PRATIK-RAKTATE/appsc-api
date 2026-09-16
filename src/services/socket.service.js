import jwt from "jsonwebtoken";

import { registerChatSocketHandlers } from "../handlers/chat.socket.handler.js";

/**
 * Map from sessionId → Set<socket>.
 *
 * Each authenticated socket stores the sessionId decoded from its JWT
 * (`sid` claim, populated by auth.service when the session document is
 * created). This lets us emit session_revoked exclusively to sockets that
 * belong to the revoked session, never to the newly-logged-in device.
 */
const sessionSockets = new Map();
const userSockets = new Map();

export const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.userId = decoded.userId || decoded.id;
      socket.sessionId = decoded.sid;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { sessionId, userId } = socket;

    if (sessionId) {
      if (!sessionSockets.has(sessionId)) {
        sessionSockets.set(sessionId, new Set());
      }
      sessionSockets.get(sessionId).add(socket);
    }

    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket);

      if (typeof socket.join === "function") {
        socket.join(`user:${userId}`);
      }
    }

    registerChatSocketHandlers(io, socket);

    socket.on("disconnect", () => {
      if (sessionId) {
        const sockets = sessionSockets.get(sessionId);
        if (sockets) {
          sockets.delete(socket);
          if (sockets.size === 0) {
            sessionSockets.delete(sessionId);
          }
        }
      }

      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
    });
  });
};

/** Test helper – clears all tracked sockets between test runs. */
export const resetUserSockets = () => {
  sessionSockets.clear();
  userSockets.clear();
};

/**
 * TASK-01.3.2 – Emit `session_revoked` to every socket that belongs to one
 * of the specified (now-revoked) sessions.
 *
 * Only the sockets whose sessionId is in `revokedSessionIds` receive the
 * event. The newly-authenticated device's socket (which carries the new
 * sessionId) is never targeted.
 *
 * @param {string[]} revokedSessionIds - Array of revoked session _id strings.
 */
export const emitSessionRevoked = (revokedSessionIds) => {
  const payload = {
    message:
      "Your session has been terminated due to login from another device",
  };

  for (const sessionId of revokedSessionIds) {
    const sockets = sessionSockets.get(sessionId);
    if (!sockets) continue;

    sockets.forEach((socket) => {
      socket.emit("session_revoked", payload);
    });
  }
};
