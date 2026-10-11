import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { TodayWidget } from './components/TodayWidget';
import { FridgeCalendar } from './components/FridgeCalendar';
import { SettlementView } from './components/SettlementView';
import { ReportView } from './components/ReportView';
import { DayEditModal } from './components/DayEditModal';
import { BatchCancelModal } from './components/BatchCancelModal';
import { SettingsModal } from './components/SettingsModal';
import { FamilySyncModal } from './components/FamilySyncModal';
import {
  DayStatus,
  LunchRecord,
  AppSettings,
  MonthlyPaymentRecord,
  ExtraPayment,
} from './types/lunch';
import {
  loadSettings,
  saveSettings,
  loadRecords,
  saveRecords,
  loadPayments,
  savePayments,
  loadExtraPayments,
  saveExtraPayments,
  computeSettlement,
  DEFAULT_SETTINGS,
} from './utils/storage';
import {
  formatDateToIso,
  getSchoolMonths,
  getMonthDays,
} from './utils/czechCalendar';
import { testFirebaseConnection } from './firebase';
import {
  FamilyInfo,
  getStoredFamilyId,
  setStoredFamilyId,
  getStoredUserRole,
  setStoredUserRole,
  createFamily,
  joinFamilyByCode,
  getFamilyById,
  subscribeToFamily,
  syncRecordToCloud,
  syncPaymentToCloud,
  syncExtraPaymentToCloud,
  syncSettingsToCloud,
} from './services/familySync';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today_calendar' | 'settlement' | 'report' | 'settings'>('today_calendar');
  const [todayIso] = useState<string>(() => formatDateToIso(new Date()));

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [records, setRecords] = useState<Record<string, LunchRecord>>(() => loadRecords());
  const [payments, setPayments] = useState<Record<string, MonthlyPaymentRecord>>(() =>
    loadPayments(settings.schoolYearStartYear, settings.monthlyPayment)
  );
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>(() => loadExtraPayments());

  // Family sharing state
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [userRole, setUserRole] = useState<string>(() => getStoredUserRole());
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);
  const isSyncingFromCloudRef = useRef(false);

  // Default month selection: current school month
  const schoolMonths = useMemo(() => getSchoolMonths(settings.schoolYearStartYear), [settings.schoolYearStartYear]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const currentPrefix = todayIso.slice(0, 7); // '2026-10'
    const found = schoolMonths.find((m) => m.key === currentPrefix);
    return found ? found.key : schoolMonths[1]?.key || schoolMonths[0]?.key;
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

  // 1. Initial test connection to Firebase on boot
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // 2. Check for URL invite parameter (?family=CODE) or stored family session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const familyCodeFromUrl = params.get('family');

    const initFamily = async () => {
      if (familyCodeFromUrl) {
        // Auto-join from URL invite
        const joined = await joinFamilyByCode(familyCodeFromUrl);
        if (joined) {
          setFamilyInfo(joined);
          // clean URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      // Check localStorage for active family ID
      const storedId = getStoredFamilyId();
      if (storedId) {
        const info = await getFamilyById(storedId);
        if (info) {
          setFamilyInfo(info);
        } else {
          setStoredFamilyId(null);
        }
      }
    };

    initFamily();
  }, []);

  // 3. Real-time Firebase listeners when familyInfo is active
  useEffect(() => {
    if (!familyInfo) return;

    const unsubscribe = subscribeToFamily(familyInfo.id, {
      onSettingsChange: (newSettings) => {
        isSyncingFromCloudRef.current = true;
        setSettings(newSettings);
        saveSettings(newSettings);
        isSyncingFromCloudRef.current = false;
      },
      onRecordsChange: (newRecords) => {
        isSyncingFromCloudRef.current = true;
        setRecords(newRecords);
        saveRecords(newRecords);
        isSyncingFromCloudRef.current = false;
      },
      onPaymentsChange: (newPayments) => {
        isSyncingFromCloudRef.current = true;
        setPayments(newPayments);
        savePayments(newPayments);
        isSyncingFromCloudRef.current = false;
      },
      onExtrasChange: (newExtras) => {
        isSyncingFromCloudRef.current = true;
        setExtraPayments(newExtras);
        saveExtraPayments(newExtras);
        isSyncingFromCloudRef.current = false;
      },
      onError: (err) => {
        console.warn('Family sync listener error:', err);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [familyInfo]);

  // Settlement calculations
  const settlement = useMemo(() => {
    return computeSettlement(settings, records, payments, extraPayments, todayIso);
  }, [settings, records, payments, extraPayments, todayIso]);

  // Handlers for single day updates
  const handleSetStatus = (dateStr: string, status: DayStatus, note?: string) => {
    const updated = { ...records };
    let recordPayload: LunchRecord | null = null;

    if (status === 'unmarked' && !note) {
      delete updated[dateStr];
    } else {
      recordPayload = {
        date: dateStr,
        status,
        note: note || updated[dateStr]?.note,
        updatedAt: Date.now(),
      };
      updated[dateStr] = recordPayload;
    }

    setRecords(updated);
    saveRecords(updated);

    // Sync to cloud if family sharing is active
    if (familyInfo) {
      syncRecordToCloud(familyInfo.id, recordPayload, dateStr);
    }
  };

  const handleDeleteRecord = (dateStr: string) => {
    const updated = { ...records };
    delete updated[dateStr];
    setRecords(updated);
    saveRecords(updated);

    if (familyInfo) {
      syncRecordToCloud(familyInfo.id, null, dateStr);
    }
  };

  // Bulk fill month as eaten for all weekdays
  const handleBulkFillMonth = (year: number, monthIndex: number) => {
    const days = getMonthDays(year, monthIndex);
    const updated = { ...records };

    days.forEach((d) => {
      if (d.isWeekend || d.isHoliday) return;
      if (!updated[d.dateStr] || updated[d.dateStr].status === 'unmarked') {
        const item: LunchRecord = {
          date: d.dateStr,
          status: 'eaten',
          updatedAt: Date.now(),
        };
        updated[d.dateStr] = item;
        if (familyInfo) {
          syncRecordToCloud(familyInfo.id, item, d.dateStr);
        }
      }
    });

    setRecords(updated);
    saveRecords(updated);
  };

  // Batch cancel / set status for date range
  const handleApplyBatch = (
    startDateIso: string,
    endDateIso: string,
    status: DayStatus,
    note?: string
  ) => {
    const updated = { ...records };
    const cur = new Date(startDateIso);
    const end = new Date(endDateIso);

    while (cur <= end) {
      const dateStr = formatDateToIso(cur);
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const item: LunchRecord = {
          date: dateStr,
          status,
          note: note || updated[dateStr]?.note,
          updatedAt: Date.now(),
        };
        updated[dateStr] = item;
        if (familyInfo) {
          syncRecordToCloud(familyInfo.id, item, dateStr);
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    setRecords(updated);
    saveRecords(updated);
  };

  // Payments handlers
  const handleTogglePaymentPaid = (monthKey: string) => {
    const existing = payments[monthKey] || {
      id: monthKey,
      monthKey,
      label: monthKey,
      plannedAmount: settings.monthlyPayment,
      paid: false,
      actualAmount: settings.monthlyPayment,
    };

    const newPayment: MonthlyPaymentRecord = {
      ...existing,
      paid: !existing.paid,
      paidDate: !existing.paid ? `${monthKey}-${settings.paymentDayOfMonth || 15}` : undefined,
    };

    const updated = {
      ...payments,
      [monthKey]: newPayment,
    };

    setPayments(updated);
    savePayments(updated);

    if (familyInfo) {
      syncPaymentToCloud(familyInfo.id, newPayment);
    }
  };

  const handleUpdatePaymentAmount = (monthKey: string, amount: number) => {
    const existing = payments[monthKey] || {
      id: monthKey,
      monthKey,
      label: monthKey,
      plannedAmount: settings.monthlyPayment,
      paid: true,
      actualAmount: amount,
    };

    const newPayment: MonthlyPaymentRecord = {
      ...existing,
      actualAmount: amount,
    };

    const updated = {
      ...payments,
      [monthKey]: newPayment,
    };

    setPayments(updated);
    savePayments(updated);

    if (familyInfo) {
      syncPaymentToCloud(familyInfo.id, newPayment);
    }
  };

  const handleAddExtraPayment = (extra: Omit<ExtraPayment, 'id'>) => {
    const newExtra: ExtraPayment = {
      ...extra,
      id: `extra_${Date.now()}`,
    };
    const updated = [...extraPayments, newExtra];
    setExtraPayments(updated);
    saveExtraPayments(updated);

    if (familyInfo) {
      syncExtraPaymentToCloud(familyInfo.id, newExtra, newExtra.id);
    }
  };

  const handleDeleteExtraPayment = (id: string) => {
    const updated = extraPayments.filter((p) => p.id !== id);
    setExtraPayments(updated);
    saveExtraPayments(updated);

    if (familyInfo) {
      syncExtraPaymentToCloud(familyInfo.id, null, id);
    }
  };

  const handleUpdateInitialBalance = (amount: number) => {
    const updated = { ...settings, initialBalance: amount };
    setSettings(updated);
    saveSettings(updated);

    if (familyInfo) {
      syncSettingsToCloud(familyInfo.id, updated);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    const monthlyPaymentChanged = newSettings.monthlyPayment !== settings.monthlyPayment;
    setSettings(newSettings);
    saveSettings(newSettings);

    if (monthlyPaymentChanged) {
      const updatedPayments = { ...payments };
      Object.keys(updatedPayments).forEach((k) => {
        const p = updatedPayments[k];
        const newRecord: MonthlyPaymentRecord = {
          ...p,
          plannedAmount: newSettings.monthlyPayment,
          actualAmount: p.paid ? p.actualAmount : newSettings.monthlyPayment,
        };
        updatedPayments[k] = newRecord;
        if (familyInfo) {
          syncPaymentToCloud(familyInfo.id, newRecord);
        }
      });
      setPayments(updatedPayments);
      savePayments(updatedPayments);
    }

    if (familyInfo) {
      syncSettingsToCloud(familyInfo.id, newSettings);
    }
  };

  // Family sharing operations
  const handleCreateFamily = async (name: string) => {
    const info = await createFamily(name, settings, records, payments, extraPayments);
    setFamilyInfo(info);
  };

  const handleJoinFamily = async (code: string) => {
    const info = await joinFamilyByCode(code);
    if (info) {
      setFamilyInfo(info);
      return true;
    }
    return false;
  };

  const handleLeaveFamily = () => {
    setStoredFamilyId(null);
    setFamilyInfo(null);
  };

  const handleImportAll = (data: {
    settings: AppSettings;
    records: Record<string, LunchRecord>;
    payments: Record<string, MonthlyPaymentRecord>;
    extraPayments: ExtraPayment[];
  }) => {
    setSettings(data.settings);
    setRecords(data.records);
    setPayments(data.payments);
    setExtraPayments(data.extraPayments || []);

    saveSettings(data.settings);
    saveRecords(data.records);
    savePayments(data.payments);
    saveExtraPayments(data.extraPayments || []);

    if (familyInfo) {
      syncSettingsToCloud(familyInfo.id, data.settings);
      Object.values(data.records).forEach((r) => syncRecordToCloud(familyInfo.id, r, r.date));
      Object.values(data.payments).forEach((p) => syncPaymentToCloud(familyInfo.id, p));
    }
  };

  const handleResetDemoData = () => {
    localStorage.clear();
    const initialSettings = DEFAULT_SETTINGS;
    setSettings(initialSettings);
    saveSettings(initialSettings);

    const reloadedRecords = loadRecords();
    setRecords(reloadedRecords);

    const reloadedPayments = loadPayments(initialSettings.schoolYearStartYear, initialSettings.monthlyPayment);
    setPayments(reloadedPayments);

    setExtraPayments([]);
    saveExtraPayments([]);
    setFamilyInfo(null);
  };

  const handleClearAllData = () => {
    setRecords({});
    saveRecords({});
    setExtraPayments([]);
    saveExtraPayments([]);
    const clearedPayments = loadPayments(settings.schoolYearStartYear, settings.monthlyPayment);
    Object.keys(clearedPayments).forEach((k) => {
      clearedPayments[k].paid = false;
    });
    setPayments(clearedPayments);
    savePayments(clearedPayments);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        settlement={settlement}
        onOpenSettings={() => setIsSettingsOpen(true)}
        familyInfo={familyInfo}
        onOpenFamilyModal={() => setIsFamilyModalOpen(true)}
        userRole={userRole}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Tab 1: Today & Fridge Calendar */}
        {activeTab === 'today_calendar' && (
          <div className="space-y-6">
            {/* Quick Hero Today Widget */}
            <TodayWidget
              todayIso={todayIso}
              records={records}
              settings={settings}
              onSetStatus={handleSetStatus}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onOpenDayModal={(iso) => setDayModalDate(iso)}
            />

            {/* Visual Fridge Calendar */}
            <FridgeCalendar
              selectedMonthKey={selectedMonthKey}
              setSelectedMonthKey={setSelectedMonthKey}
              records={records}
              payments={payments}
              settings={settings}
              todayIso={todayIso}
              onOpenDayModal={(iso) => setDayModalDate(iso)}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onBulkFillMonth={handleBulkFillMonth}
            />
          </div>
        )}

        {/* Tab 2: Settlement & Standing Orders */}
        {activeTab === 'settlement' && (
          <SettlementView
            settings={settings}
            settlement={settlement}
            records={records}
            payments={payments}
            extraPayments={extraPayments}
            onTogglePaymentPaid={handleTogglePaymentPaid}
            onUpdatePaymentAmount={handleUpdatePaymentAmount}
            onAddExtraPayment={handleAddExtraPayment}
            onDeleteExtraPayment={handleDeleteExtraPayment}
            onUpdateInitialBalance={handleUpdateInitialBalance}
            todayIso={todayIso}
          />
        )}

        {/* Tab 3: Formal School Kitchen Report & Print */}
        {activeTab === 'report' && (
          <ReportView
            settings={settings}
            settlement={settlement}
            records={records}
            payments={payments}
            todayIso={todayIso}
          />
        )}

        {/* Tab 4 on Mobile: Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h2 className="text-xl font-bold mb-4">Nastavení</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsFamilyModalOpen(true)}
                className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Rodinné sdílení s manželkou</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold"
              >
                Otevřít dialog nastavení
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div>
            <strong>Obědník</strong> · Jednoduchá evidence školních obědů a trvalého příkazu
            {familyInfo && (
              <span className="ml-2 text-emerald-700 font-semibold">
                · Propojeno ({familyInfo.code})
              </span>
            )}
          </div>
          <button
            onClick={() => setIsFamilyModalOpen(true)}
            className="text-stone-600 hover:text-amber-700 font-semibold underline underline-offset-2"
          >
            {familyInfo ? 'Spravovat rodinné sdílení' : 'Sdílet s manželkou'}
          </button>
        </div>
      </footer>

      {/* Interactive Modals */}
      <DayEditModal
        dateStr={dayModalDate}
        onClose={() => setDayModalDate(null)}
        record={dayModalDate ? records[dayModalDate] : undefined}
        settings={settings}
        onSave={handleSetStatus}
        onDelete={handleDeleteRecord}
      />

      <BatchCancelModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        settings={settings}
        todayIso={todayIso}
        onApplyBatch={handleApplyBatch}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        records={records}
        payments={payments}
        extraPayments={extraPayments}
        onImportAll={handleImportAll}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />

      <FamilySyncModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        familyInfo={familyInfo}
        userRole={userRole}
        setUserRole={setUserRole}
        settings={settings}
        onCreateFamily={handleCreateFamily}
        onJoinFamily={handleJoinFamily}
        onLeaveFamily={handleLeaveFamily}
      />
    </div>
  );
}
