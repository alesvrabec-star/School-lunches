import React from 'react';
import {
  UtensilsCrossed,
  Clock,
  Calendar,
  Wallet,
  FileSpreadsheet,
  Settings as SettingsIcon,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Cloud,
} from 'lucide-react';
import { AppSettings, OverallSettlement } from '../types/lunch';
import { FamilyInfo } from '../services/familySync';
import { formatCzk } from '../utils/czechCalendar';
import { PWAInstallButton } from './PWAInstallButton';
import { AppTab } from './MobileBottomNav';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  settings: AppSettings;
  settlement: OverallSettlement;
  onOpenSettings: () => void;
  familyInfo: FamilyInfo | null;
  onOpenFamilyModal: () => void;
  userRole: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  settlement,
  onOpenSettings,
  familyInfo,
  onOpenFamilyModal,
  userRole,
}) => {
  const isSurplus = settlement.currentBalance >= 0;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Logo & Child info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-stone-900 text-base sm:text-xl tracking-tight leading-none">
                  Obědník
                </h1>
                <span className="text-stone-300 hidden sm:inline">·</span>
                <span className="text-[10px] sm:text-xs font-medium text-stone-500 hidden sm:inline bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                  {settings.schoolYear}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={onOpenSettings}
                  className="group flex items-center gap-1 text-[11px] sm:text-xs text-stone-600 hover:text-amber-700 transition-colors"
                  title="Upravit profil syna a školy"
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 group-hover:text-amber-600" />
                  <span className="font-semibold text-stone-800">{settings.child.name}</span>
                  {settings.child.grade && (
                    <span className="text-stone-400 hidden xs:inline">({settings.child.grade})</span>
                  )}
                </button>

                {/* Role badge */}
                {familyInfo && (
                  <span className="text-[9px] sm:text-[10px] font-semibold text-stone-600 bg-stone-100 px-1 py-0.2 rounded">
                    {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Balance Status & Actions in Header */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Cloud & Family backup button */}
            <button
              onClick={onOpenFamilyModal}
              className={`flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all ${
                familyInfo
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100 shadow-2xs'
              }`}
              title={
                familyInfo
                  ? `Cloudová záloha aktivní (${familyInfo.code}) - klikněte pro kód / správu`
                  : 'Aktivovat cloudovou zálohu dat'
              }
            >
              <Cloud
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  familyInfo ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <span className="hidden md:inline">
                {familyInfo ? `Záloha: ${familyInfo.code}` : 'Cloudová záloha'}
              </span>
              <span className="md:hidden">
                {familyInfo ? familyInfo.code : 'Záloha'}
              </span>
              {familyInfo ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5" />
              )}
            </button>

            {/* Current Balance Badge */}
            <div
              onClick={() => setActiveTab('settlement')}
              className={`cursor-pointer px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl border transition-all text-left ${
                isSurplus
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
              }`}
              title="Klikněte pro detailní přehled vyúčtování"
            >
              <div className="flex items-center gap-1">
                {isSurplus ? (
                  <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
                )}
                <span className="text-[9px] sm:text-xs uppercase font-bold tracking-wider opacity-75 hidden xs:inline">
                  {isSurplus ? 'Přeplatek' : 'Nedoplatek'}
                </span>
              </div>
              <div className="text-xs sm:text-base font-bold font-mono leading-none sm:leading-normal">
                {isSurplus ? '+' : ''}
                {formatCzk(settlement.currentBalance)}
              </div>
            </div>

            {/* PWA Home screen install button */}
            <PWAInstallButton />

            {/* Desktop Settings button */}
            <button
              onClick={onOpenSettings}
              className="hidden md:flex p-2 sm:p-2.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
              aria-label="Nastavení"
              title="Nastavení cen a plateb"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Tab navigation (hidden on mobile, mobile uses BottomNav) */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Dnes (Rychlý zápis)</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lednice (Kalendář)</span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'settlement'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Vyúčtování & Trvalý příkaz</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Podklad pro školu & Tisk</span>
          </button>
        </div>
      </div>
    </header>
  );
};
