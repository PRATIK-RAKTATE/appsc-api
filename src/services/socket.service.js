import jwt from "jsonwebtoken";

const userSockets = new Map();

export const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      );

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }

    userSockets.get(userId).add(socket);

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });
};

export const resetUserSockets = () => {
  userSockets.clear();
};

export const notifySessionTerminated = (userId) => {
  const sockets = userSockets.get(userId);
  if (!sockets) {
    return;
  }

  const payload = {
    message:
      "Your session has been terminated due to login from another device",
  };

  sockets.forEach((socket) => {
    socket.emit("session:terminated", payload);
  });
};
