import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem('appsc_access_token');
    socketInstance = io(window.location.origin, {
      autoConnect: false,
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
};

export const connectSocket = () => {
  const socket = getSocket();
  const token = localStorage.getItem('appsc_access_token');
  if (token) {
    socket.auth = { token: `Bearer ${token}` };
    if (!socket.connected) {
      socket.connect();
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
};
