import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button, Card } from '../../components/ui';

export const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center p-8 border-red-500/20 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">403 — Access Restricted</h2>
        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
          Your account role does not have authorization to view this protected resource. Role boundaries are strictly enforced across Student, Mentor, and Admin portals.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="accent" icon={Home} onClick={() => navigate('/student/dashboard')}>
            Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
