import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Camera, 
  CreditCard, 
  Menu,
  Sparkles,
  Wifi
} from 'lucide-react';
import { canUserAccessTab } from '../../utils/permissions';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { activeTab, setActiveTab, visibleLeads, currentUser, roleModuleMapping } = useApp();

  const canAccessLeads = canUserAccessTab(currentUser, 'leads', roleModuleMapping);
  const canAccessScanner = canUserAccessTab(currentUser, 'scanner', roleModuleMapping);
  const canAccessCards = canUserAccessTab(currentUser, 'cards', roleModuleMapping);

  return (
    <nav 
      aria-label="Navigation mobile rapide"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 text-slate-400 px-2 py-1.5 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
        
        {/* 1. Dashboard / Mon Espace */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] ${
            activeTab === 'dashboard'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-500/20' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Accueil</span>
        </button>

        {/* 2. Prospects / CRM */}
        {canAccessLeads && (
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] relative ${
              activeTab === 'leads'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'leads' ? 'bg-indigo-500/20' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            {visibleLeads.length > 0 && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
            )}
            <span className="text-[10px] mt-0.5 tracking-tight">Prospects</span>
          </button>
        )}

        {/* 3. Center Action: Scanner IA OCR */}
        {canAccessScanner ? (
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className="flex flex-col items-center justify-center -mt-4 py-1 px-2 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 flex items-center justify-center transition transform group-active:scale-95 border-2 border-slate-900">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-300 mt-1">Scanner</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className="flex flex-col items-center justify-center -mt-4 py-1 px-2 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 flex items-center justify-center transition transform group-active:scale-95 border-2 border-slate-900">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-300 mt-1">Cartes</span>
          </button>
        )}

        {/* 4. Cartes NFC */}
        {canAccessCards && (
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'cards'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'cards' ? 'bg-indigo-500/20' : ''}`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Cartes NFC</span>
          </button>
        )}

        {/* 5. Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] text-slate-400 hover:text-slate-200"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>

      </div>
    </nav>
  );
};
