import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button, Card } from '../../components/ui';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center p-8 border-neutral-800">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto mb-6">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">404 — Page Not Found</h2>
        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
          The requested page does not exist or may have been moved.
        </p>
        <Button variant="accent" icon={Home} className="w-full" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </Card>
    </div>
  );
};
