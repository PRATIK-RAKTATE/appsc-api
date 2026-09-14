import { describe, it, expect, vi, beforeEach } from "vitest";

const { verify: mockJwtVerify } = vi.hoisted(() => ({
  verify: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

import {
  registerSocketHandlers,
  emitSessionRevoked,
  resetUserSockets,
} from "../services/socket.service.js";

describe("Socket Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUserSockets();
  });

  it("should add an authenticated socket to the session socket map", () => {
    const mockSocket = {
      userId: "user-1",
      sessionId: "session-1",
      handshake: { auth: { token: "valid-token" } },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => middleware(mockSocket, () => {})),
      on: vi.fn((event, handler) => {
        if (event === "connection") handler(mockSocket);
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1", sid: "session-1" });

    registerSocketHandlers(mockIo);

    expect(mockIo.use).toHaveBeenCalled();
    expect(mockIo.on).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  it("should emit session_revoked to a socket registered under the given sessionId", () => {
    const mockSocket = {
      userId: "user-1",
      sessionId: "session-old",
      handshake: { auth: { token: "valid-token" } },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => middleware(mockSocket, () => {})),
      on: vi.fn((event, handler) => {
        if (event === "connection") handler(mockSocket);
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1", sid: "session-old" });

    registerSocketHandlers(mockIo);
    emitSessionRevoked(["session-old"]);

    expect(mockSocket.emit).toHaveBeenCalledWith("session_revoked", {
      message:
        "Your session has been terminated due to login from another device",
    });
  });

  it("should do nothing when emitting to a sessionId with no active sockets", () => {
    const mockSocket = {
      userId: "user-1",
      sessionId: "session-1",
      handshake: { auth: { token: "valid-token" } },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => middleware(mockSocket, () => {})),
      on: vi.fn((event, handler) => {
        if (event === "connection") handler(mockSocket);
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1", sid: "session-1" });

    registerSocketHandlers(mockIo);

    // Target a session that has no socket registered
    emitSessionRevoked(["session-unknown"]);

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
