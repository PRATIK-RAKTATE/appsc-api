import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WatermarkOverlay } from '../security/WatermarkOverlay';
import { SessionTerminationModal } from '../auth/SessionTerminationModal';
import { AiAssistantDrawer } from '../ai/AiAssistantDrawer';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-neutral-100 relative">
      {/* Global DRM & Eviction Listeners */}
      <WatermarkOverlay />
      <SessionTerminationModal />

      {/* Global Floating AI Assistant Drawer (Issue #71) */}
      <AiAssistantDrawer />

      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
