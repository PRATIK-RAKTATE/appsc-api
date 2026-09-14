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
  notifySessionTerminated,
  resetUserSockets,
} from "../services/socket.service.js";

describe("Socket Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUserSockets();
  });

  it("should add authenticated socket to user session map", () => {
    const mockSocket = {
      userId: "user-1",
      handshake: {
        auth: {
          token: "valid-token",
        },
      },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => {
        middleware(mockSocket, () => {});
      }),
      on: vi.fn((event, handler) => {
        if (event === "connection") {
          handler(mockSocket);
        }
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1" });

    registerSocketHandlers(mockIo);

    expect(mockIo.use).toHaveBeenCalled();
    expect(mockIo.on).toHaveBeenCalledWith(
      "connection",
      expect.any(Function)
    );
  });

  it("should emit session:terminated to all sockets for the user", () => {
    const mockSocket = {
      userId: "user-1",
      handshake: {
        auth: {
          token: "valid-token",
        },
      },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => {
        middleware(mockSocket, () => {});
      }),
      on: vi.fn((event, handler) => {
        if (event === "connection") {
          handler(mockSocket);
        }
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1" });

    registerSocketHandlers(mockIo);
    notifySessionTerminated("user-1");

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "session:terminated",
      {
        message:
          "Your session has been terminated due to login from another device",
      }
    );
  });

  it("should do nothing when notifying a user with no active sockets", () => {
    const mockSocket = {
      userId: "user-1",
      handshake: {
        auth: {
          token: "valid-token",
        },
      },
      on: vi.fn(),
      emit: vi.fn(),
    };

    const mockIo = {
      use: vi.fn((middleware) => {
        middleware(mockSocket, () => {});
      }),
      on: vi.fn((event, handler) => {
        if (event === "connection") {
          handler(mockSocket);
        }
      }),
    };

    mockJwtVerify.mockReturnValue({ userId: "user-1" });

    registerSocketHandlers(mockIo);
    notifySessionTerminated("user-without-sockets");

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
