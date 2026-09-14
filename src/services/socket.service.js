import jwt from "jsonwebtoken";

/**
 * Map from sessionId → Set<socket>.
 *
 * Each authenticated socket stores the sessionId decoded from its JWT
 * (`sid` claim, populated by auth.service when the session document is
 * created). This lets us emit session_revoked exclusively to sockets that
 * belong to the revoked session, never to the newly-logged-in device.
 */
const sessionSockets = new Map();

export const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      socket.userId = decoded.userId;
      socket.sessionId = decoded.sid;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { sessionId } = socket;

    if (!sessionSockets.has(sessionId)) {
      sessionSockets.set(sessionId, new Set());
    }

    sessionSockets.get(sessionId).add(socket);

    socket.on("disconnect", () => {
      const sockets = sessionSockets.get(sessionId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          sessionSockets.delete(sessionId);
        }
      }
    });
  });
};

/** Test helper – clears all tracked sockets between test runs. */
export const resetUserSockets = () => {
  sessionSockets.clear();
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
