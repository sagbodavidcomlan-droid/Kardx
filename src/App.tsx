import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { PublicProfileView } from './components/profile/PublicProfileView';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ProfileEditor } from './components/profile/ProfileEditor';
import { DesignEditor } from './components/profile/DesignEditor';
import { CardsManager } from './components/cards/CardsManager';
import { LeadsManager } from './components/leads/LeadsManager';
import { FormBuilder } from './components/forms/FormBuilder';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { TeamManager } from './components/team/TeamManager';
import { BulkEditor } from './components/team/BulkEditor';
import { EmailSignatureGenerator } from './components/signature/EmailSignatureGenerator';
import { WalletPassGenerator } from './components/wallet/WalletPassGenerator';
import { AiCardScanner } from './components/scanner/AiCardScanner';
import { IntegrationsHub } from './components/integrations/IntegrationsHub';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { SettingsPage } from './components/settings/SettingsPage';
import { LandingPage } from './components/landing/LandingPage';
import { ExchangeModal } from './components/leads/ExchangeModal';
import { NfcSimulatorModal } from './components/cards/NfcSimulatorModal';
import { AuthModal } from './components/auth/AuthModal';
import { ForcePasswordChangeScreen } from './components/auth/ForcePasswordChangeScreen';
import { AccessDeniedNotice } from './components/common/AccessDeniedNotice';
import { canUserAccessTab } from './utils/permissions';

export const App: React.FC = () => {
  const { 
    activeTab, 
    currentUser,
    roleModuleMapping,
    publicProfileSlug, 
    isExchangeModalOpen, 
    isNfcSimModalOpen, 
    toastMessage 
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('kardx_sidebar_collapsed');
    return saved === 'true';
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kardx_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If a public profile is requested directly (public visitor view or full preview)
  if (publicProfileSlug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <PublicProfileView isEmbeddedPreview={false} />
        {isExchangeModalOpen && <ExchangeModal />}
        {isNfcSimModalOpen && <NfcSimulatorModal />}
        <AuthModal />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  // Public Landing view
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <TopHeader onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1">
          <LandingPage />
        </main>
        {isExchangeModalOpen && <ExchangeModal />}
        {isNfcSimModalOpen && <NfcSimulatorModal />}
        <AuthModal />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  // Mandatory First-Login Password Change Gate for Organization Admins & Collaborators
  if (currentUser && currentUser.mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <ForcePasswordChangeScreen />
        <AuthModal />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#0F172A] text-white text-xs font-semibold shadow-2xl shadow-slate-900/30 border border-slate-700/60 animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  const isTabPermitted = canUserAccessTab(currentUser, activeTab, roleModuleMapping);

  // Authenticated Platform Application Shell
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ergonomic & Accessible Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Layout Area offset by Sidebar */}
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <TopHeader onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Main Content View Switcher */}
        <main className="flex-1 pb-24 lg:pb-16">
          <div key={activeTab} className="animate-page-enter">
            {!isTabPermitted ? (
              <AccessDeniedNotice tabName={activeTab} />
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardOverview />}
                {activeTab === 'profile' && <ProfileEditor />}
                {activeTab === 'design' && <DesignEditor />}
                {activeTab === 'cards' && <CardsManager />}
                {activeTab === 'leads' && <LeadsManager />}
                {activeTab === 'forms' && <FormBuilder />}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
                {activeTab === 'team' && <TeamManager />}
                {activeTab === 'bulk' && <BulkEditor />}
                {activeTab === 'signature' && <EmailSignatureGenerator />}
                {activeTab === 'wallet' && <WalletPassGenerator />}
                {activeTab === 'scanner' && <AiCardScanner />}
                {activeTab === 'integrations' && <IntegrationsHub />}
                {activeTab === 'admin' && <SuperAdminDashboard />}
                {activeTab === 'settings' && <SettingsPage />}
              </>
            )}
          </div>
        </main>

        {/* Ergonomic Mobile Bottom Navigation */}
        <MobileBottomNav onOpenMenu={() => setMobileSidebarOpen(true)} />
      </div>

      {/* Global Modals & Overlays */}
      {isExchangeModalOpen && <ExchangeModal />}
      {isNfcSimModalOpen && <NfcSimulatorModal />}
      <AuthModal />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#0F172A] text-white text-xs font-semibold shadow-2xl shadow-slate-900/30 border border-slate-700/60 animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
