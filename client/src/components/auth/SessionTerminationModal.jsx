import React, { useEffect, useState } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { Modal, Button } from '../ui';

export const SessionTerminationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isSessionRevoked = useAuthStore((s) => s.isSessionRevoked);
  const triggerSessionRevoked = useAuthStore((s) => s.triggerSessionRevoked);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const socket = getSocket();

    const handleSessionRevoked = (data) => {
      triggerSessionRevoked();
      setIsOpen(true);
    };

    socket.on('session_revoked', handleSessionRevoked);

    return () => {
      socket.off('session_revoked', handleSessionRevoked);
    };
  }, [triggerSessionRevoked]);

  useEffect(() => {
    if (isSessionRevoked) {
      setIsOpen(true);
    }
  }, [isSessionRevoked]);

  const handleReturnToLogin = () => {
    setIsOpen(false);
    logout();
    window.location.href = '/login?reason=session_terminated';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Session Terminated"
      isDismissible={false}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center py-3">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/10">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h4 className="text-base font-semibold text-neutral-100 mb-2">
          Logged In From Another Device
        </h4>

        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Your active session has been terminated because your account was accessed from another browser or device. APPSC Prep restricts accounts to one active session to safeguard your exam progress.
        </p>

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          icon={LogIn}
          onClick={handleReturnToLogin}
        >
          Return to Login
        </Button>
      </div>
    </Modal>
  );
};
