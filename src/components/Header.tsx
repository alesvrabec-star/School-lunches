import React from 'react';
import {
  UtensilsCrossed,
  Calendar,
  Wallet,
  FileSpreadsheet,
  Settings as SettingsIcon,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react';
import { AppSettings, OverallSettlement } from '../types/lunch';
import { FamilyInfo } from '../services/familySync';
import { formatCzk } from '../utils/czechCalendar';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'today_calendar' | 'settlement' | 'report' | 'settings';
  setActiveTab: (tab: 'today_calendar' | 'settlement' | 'report' | 'settings') => void;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Child info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-stone-900 text-lg sm:text-xl tracking-tight">
                  Obědník
                </h1>
                <span className="text-stone-400 hidden sm:inline">·</span>
                <span className="text-xs font-medium text-stone-500 hidden sm:inline bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                  {settings.schoolYear}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={onOpenSettings}
                  className="group flex items-center gap-1.5 text-xs text-stone-600 hover:text-amber-700 transition-colors"
                  title="Upravit profil syna a školy"
                >
                  <User className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                  <span className="font-semibold text-stone-800">{settings.child.name}</span>
                  {settings.child.grade && (
                    <span className="text-stone-400">({settings.child.grade})</span>
                  )}
                </button>

                {/* Role badge */}
                {familyInfo && (
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Balance Status & Family Sharing CTA in Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Family sharing button */}
            <button
              onClick={onOpenFamilyModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-semibold transition-all ${
                familyInfo
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs'
              }`}
              title={
                familyInfo
                  ? `Sdíleno v rodině (${familyInfo.code}) - klikněte pro kód / QR kód`
                  : 'Zapnout rodinné sdílení pro manželku'
              }
            >
              <Users
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  familyInfo ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <span className="hidden md:inline">
                {familyInfo ? `Rodina: ${familyInfo.code}` : 'Rodinné sdílení'}
              </span>
              <span className="md:hidden">
                {familyInfo ? familyInfo.code : 'Sdílet'}
              </span>
              {familyInfo ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              ) : (
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded ml-0.5">
                  nové
                </span>
              )}
            </button>

            {/* Current Balance Badge */}
            <div
              onClick={() => setActiveTab('settlement')}
              className={`cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all text-left ${
                isSurplus
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
              }`}
              title="Klikněte pro detailní přehled vyúčtování"
            >
              <div className="flex items-center gap-1.5">
                {isSurplus ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider opacity-75">
                  {isSurplus ? 'Přeplatek' : 'Nedoplatek'}
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono">
                {isSurplus ? '+' : ''}
                {formatCzk(settlement.currentBalance)}
              </div>
            </div>

            {/* PWA Home screen install button */}
            <PWAInstallButton />

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 sm:p-2.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
              aria-label="Nastavení"
              title="Nastavení cen a plateb"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => setActiveTab('today_calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'today_calendar'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Dnes & Lednice</span>
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

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap sm:hidden ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Nastavení</span>
          </button>
        </div>
      </div>
    </header>
  );
};
