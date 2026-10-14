import React from 'react';
import {
  Clock,
  Calendar,
  Wallet,
  FileSpreadsheet,
  Settings,
  Users,
} from 'lucide-react';

export type AppTab = 'today' | 'calendar' | 'settlement' | 'report' | 'settings';

interface MobileBottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  hasFamily: boolean;
  onOpenFamilyModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasFamily,
  onOpenFamilyModal,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-14">
        {/* TAB 1: Dnes */}
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'today'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Dnes</span>
        </button>

        {/* TAB 2: Lednice / Kalendář */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'calendar'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Lednice</span>
        </button>

        {/* TAB 3: Vyúčtování */}
        <button
          onClick={() => setActiveTab('settlement')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'settlement'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'settlement' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Finance</span>
        </button>

        {/* TAB 4: Podklad */}
        <button
          onClick={() => setActiveTab('report')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'report'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'report' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Podklad</span>
        </button>

        {/* TAB 5: Nastavení / Rodina */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 relative transition-colors ${
            activeTab === 'settings'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Nastavení</span>
          {hasFamily && (
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
};
