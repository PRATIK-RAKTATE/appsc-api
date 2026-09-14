import { describe, it, expect, vi, beforeEach } from "vitest";

const { verify: mockJwtVerify } = vi.hoisted(() => ({
  verify: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: { verify: mockJwtVerify },
}));

import {
  registerSocketHandlers,
  emitSessionRevoked,
  resetUserSockets,
} from "../services/socket.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Register a single socket (identified by userId + sessionId) with the
 * socket service by simulating a full io.use + io.on("connection") cycle.
 */
const connectSocket = (io, userId, sessionId) => {
  const socket = {
    userId,
    sessionId,
    handshake: { auth: { token: "tok" } },
    on: vi.fn(),
    emit: vi.fn(),
  };

  // io.use middleware sets socket.userId / socket.sessionId from the JWT
  mockJwtVerify.mockReturnValueOnce({ userId, sid: sessionId });

  const useMiddleware = io.use.mock.calls[0]?.[0];
  if (useMiddleware) useMiddleware(socket, () => {});

  const connectionHandler = io.on.mock.calls.find(
    ([e]) => e === "connection"
  )?.[1];
  if (connectionHandler) connectionHandler(socket);

  return socket;
};

const buildIo = () => ({
  use: vi.fn(),
  on: vi.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TASK-01.3.2 – emitSessionRevoked: session_revoked targeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUserSockets();
  });

  it("emits session_revoked with the correct message to the old session's socket", () => {
    const io = buildIo();
    registerSocketHandlers(io);

    const oldSocket = connectSocket(io, "user-1", "session-old");

    emitSessionRevoked(["session-old"]);

    expect(oldSocket.emit).toHaveBeenCalledWith("session_revoked", {
      message:
        "Your session has been terminated due to login from another device",
    });
  });

  it("does NOT emit session_revoked to the newly-logged-in device's socket", () => {
    const io = buildIo();
    registerSocketHandlers(io);

    // Device A connects first (old session)
    const oldSocket = connectSocket(io, "user-1", "session-old");
    // Device B connects with the new session
    const newSocket = connectSocket(io, "user-1", "session-new");

    // Only the old session is revoked
    emitSessionRevoked(["session-old"]);

    expect(oldSocket.emit).toHaveBeenCalledWith(
      "session_revoked",
      expect.any(Object)
    );
    expect(newSocket.emit).not.toHaveBeenCalled();
  });

  it("emits session_revoked to all sockets sharing the old sessionId (multiple tabs)", () => {
    const io = buildIo();
    registerSocketHandlers(io);

    // Two tabs, same old session
    const tabA = connectSocket(io, "user-1", "session-old");
    const tabB = connectSocket(io, "user-1", "session-old");

    emitSessionRevoked(["session-old"]);

    const expected = {
      message:
        "Your session has been terminated due to login from another device",
    };
    expect(tabA.emit).toHaveBeenCalledWith("session_revoked", expected);
    expect(tabB.emit).toHaveBeenCalledWith("session_revoked", expected);
  });

  it("does nothing (no throw) when none of the revoked sessionIds have active sockets", () => {
    expect(() => emitSessionRevoked(["ghost-session"])).not.toThrow();
  });

  it("does not emit session_revoked to sockets belonging to a different user", () => {
    const io = buildIo();
    registerSocketHandlers(io);

    const socketA = connectSocket(io, "user-x", "session-x");
    const socketB = connectSocket(io, "user-y", "session-y");

    emitSessionRevoked(["session-x"]);

    expect(socketA.emit).toHaveBeenCalledWith(
      "session_revoked",
      expect.any(Object)
    );
    expect(socketB.emit).not.toHaveBeenCalled();
  });

  it("emits to multiple revoked sessions in one call", () => {
    const io = buildIo();
    registerSocketHandlers(io);

    const socketA = connectSocket(io, "user-1", "session-a");
    const socketB = connectSocket(io, "user-1", "session-b");
    const socketC = connectSocket(io, "user-1", "session-new");

    emitSessionRevoked(["session-a", "session-b"]);

    expect(socketA.emit).toHaveBeenCalledWith("session_revoked", expect.any(Object));
    expect(socketB.emit).toHaveBeenCalledWith("session_revoked", expect.any(Object));
    expect(socketC.emit).not.toHaveBeenCalled();
  });
});
