import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  PiggyBank,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  HelpCircle,
  TrendingUp,
  Receipt,
  Sparkles,
  Pencil,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import {
  AppSettings,
  MonthlyPaymentRecord,
  LunchRecord,
  ExtraPayment,
  OverallSettlement,
} from '../types/lunch';
import {
  getSchoolMonths,
  formatCzk,
  getMonthDays,
} from '../utils/czechCalendar';
import { computeMonthSummary } from '../utils/storage';

interface SettlementViewProps {
  settings: AppSettings;
  settlement: OverallSettlement;
  records: Record<string, LunchRecord>;
  payments: Record<string, MonthlyPaymentRecord>;
  extraPayments: ExtraPayment[];
  onTogglePaymentPaid: (monthKey: string) => void;
  onUpdatePaymentAmount: (monthKey: string, amount: number, paid?: boolean, note?: string) => void;
  onApplyPaymentToAllMonths: (amount: number) => void;
  onAddExtraPayment: (payment: Omit<ExtraPayment, 'id'>) => void;
  onDeleteExtraPayment: (id: string) => void;
  onUpdateInitialBalance: (amount: number) => void;
  todayIso: string;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  settings,
  settlement,
  records,
  payments,
  extraPayments,
  onTogglePaymentPaid,
  onUpdatePaymentAmount,
  onApplyPaymentToAllMonths,
  onAddExtraPayment,
  onDeleteExtraPayment,
  onUpdateInitialBalance,
  todayIso,
}) => {
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraAmount, setExtraAmount] = useState('500');
  const [extraNote, setExtraNote] = useState('');
  const [extraDate, setExtraDate] = useState(todayIso);
  const [extraType, setExtraType] = useState<'deposit' | 'refund'>('deposit');

  const [editingInitial, setEditingInitial] = useState(false);
  const [initialInput, setInitialInput] = useState(String(settings.initialBalance || 0));

  // Edit single month payment modal
  const [editingMonthKey, setEditingMonthKey] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');
  const [editPaymentPaid, setEditPaymentPaid] = useState<boolean>(true);
  const [editPaymentNote, setEditPaymentNote] = useState<string>('');

  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);

  const openEditPayment = (monthKey: string) => {
    const pay = payments[monthKey];
    const currentVal = pay?.actualAmount ?? pay?.plannedAmount ?? settings.monthlyPayment;
    setEditingMonthKey(monthKey);
    setEditPaymentAmount(String(currentVal));
    setEditPaymentPaid(pay?.paid ?? false);
    setEditPaymentNote(pay?.note || '');
  };

  const handleSaveMonthPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonthKey) return;
    const amountVal = parseFloat(editPaymentAmount) || 0;
    onUpdatePaymentAmount(editingMonthKey, amountVal, editPaymentPaid, editPaymentNote);
    setEditingMonthKey(null);
  };

  const handleApplyCurrentToAll = () => {
    const amountVal = parseFloat(editPaymentAmount) || 0;
    if (confirm(`Nastavit částku ${formatCzk(amountVal)} pro všechny měsíce školního roku (září až červen)?`)) {
      onApplyPaymentToAllMonths(amountVal);
      setEditingMonthKey(null);
    }
  };

  const handleSaveExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(extraAmount) || 0;
    if (amountVal <= 0) return;

    onAddExtraPayment({
      amount: extraType === 'deposit' ? amountVal : -amountVal,
      note: extraNote || (extraType === 'deposit' ? 'Mimořádný vklad' : 'Vratka ze školy'),
      date: extraDate,
      type: extraType,
    });
    setExtraNote('');
    setShowAddExtra(false);
  };

  const handleSaveInitial = () => {
    const val = parseFloat(initialInput) || 0;
    onUpdateInitialBalance(val);
    setEditingInitial(false);
  };

  // Recommended monthly payment calculation
  let totalYearSchoolDays = 0;
  schoolMonths.forEach((m) => {
    const days = getMonthDays(m.year, m.monthIndex);
    days.forEach((d) => {
      if (!d.isWeekend && !d.isHoliday) totalYearSchoolDays++;
    });
  });
  const recommendedYearTotal = totalYearSchoolDays * settings.pricePerLunch;
  const recommendedMonthly = Math.ceil(recommendedYearTotal / 10 / 10) * 10;

  const isCurrentSurplus = settlement.currentBalance >= 0;
  const isProjectedSurplus = settlement.projectedEndYearBalance >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Big Settlement Summary */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs uppercase font-bold tracking-wider mb-1">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Přehled vyúčtování obědů {settings.schoolYear}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Stav trvalého příkazu & vyúčtování
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Měsíční trvalý příkaz v nastavení: <strong>{formatCzk(settings.monthlyPayment)}</strong>.
              Zde můžete upravit jednotlivé měsíční platby a sledovat, kolik vám škola vrátí.
            </p>
          </div>

          {/* Current Balance Hero Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between min-w-[260px] ${
              isCurrentSurplus
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider opacity-75">
                Průběžný stav účtu
              </span>
              {isCurrentSurplus ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              )}
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                {isCurrentSurplus ? '+' : ''}
                {formatCzk(settlement.currentBalance)}
              </div>
              <div className="text-xs font-medium mt-0.5 opacity-80">
                {isCurrentSurplus ? 'Přeplatek (škola má u vás vklad)' : 'Nedoplatek (je třeba doplatit)'}
              </div>
            </div>

            <div className="text-[11px] opacity-70 border-t border-current/10 pt-2">
              K dnešnímu dni: zaplaceno {formatCzk(settlement.totalPaidSoFar)} vs projedené{' '}
              {formatCzk(settlement.totalSpentOnLunches)}
            </div>
          </div>
        </div>

        {/* 3 Metric cards: End-of-year projection, Saved, Payments so far */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {/* Card 1: End of year projection */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Očekávané vyúčtování (30. 6.)
              </span>
              <Calendar className="w-4 h-4 text-stone-400" />
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono ${
                isProjectedSurplus ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isProjectedSurplus ? '+' : ''}
              {formatCzk(settlement.projectedEndYearBalance)}
            </div>
            <p className="text-xs text-stone-600 mt-1">
              {isProjectedSurplus
                ? `Při běžné docházce vám škola v červnu vrátí cca ${formatCzk(
                    settlement.projectedEndYearBalance
                  )} na účet.`
                : `Při současném trvalém příkazu bude v červnu scházet cca ${formatCzk(
                    Math.abs(settlement.projectedEndYearBalance)
                  )}.`}
            </p>
          </div>

          {/* Card 2: Saved by cancelations */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Ušetřeno včasným odhlášením
              </span>
              <PiggyBank className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
              +{formatCzk(settlement.totalSavedByCancelation)}
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Za {settlement.canceledCount} včas odhlášených obědů, které škola nenaúčtovala.
            </p>
          </div>

          {/* Card 3: Standing order recommendation */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Nastavení trvalého příkazu
              </span>
              <CreditCard className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
              {formatCzk(settings.monthlyPayment)} / měs.
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Doporučený ideální příkaz: cca <strong>{formatCzk(recommendedMonthly)}</strong> / měs.
              ({totalYearSchoolDays} dní × {settings.pricePerLunch} Kč / 10).
            </p>
          </div>
        </div>

        {/* Initial balance row */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-stone-50/70 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Počáteční přeplatek z loňska (ze září):</span>
            {editingInitial ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  value={initialInput}
                  onChange={(e) => setInitialInput(e.target.value)}
                  className="w-24 px-2 py-1 border border-stone-300 rounded bg-white font-mono text-xs"
                />
                <span className="text-stone-500">Kč</span>
                <button
                  onClick={handleSaveInitial}
                  className="px-2 py-1 bg-stone-900 text-white rounded text-xs font-semibold"
                >
                  Uložit
                </button>
                <button
                  onClick={() => setEditingInitial(false)}
                  className="px-2 py-1 text-stone-500 text-xs"
                >
                  Zrušit
                </button>
              </div>
            ) : (
              <span className="font-bold font-mono text-stone-900">
                {formatCzk(settings.initialBalance || 0)}
              </span>
            )}
          </div>

          {!editingInitial && (
            <button
              onClick={() => {
                setInitialInput(String(settings.initialBalance || 0));
                setEditingInitial(true);
              }}
              className="text-amber-700 hover:underline font-semibold"
            >
              Upravit počáteční zůstatek
            </button>
          )}
        </div>
      </div>

      {/* Monthly Payments Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Měsíční rozpis trvalého příkazu ({settings.schoolYear})
            </h3>
            <p className="text-xs text-stone-500">
              Klikněte na jakoukoliv částku pro její úpravu, nebo označte, které měsíce odešly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1-click sync all months to settings.monthlyPayment */}
            <button
              onClick={() => {
                if (
                  confirm(
                    `Chcete nastavit částku ${formatCzk(
                      settings.monthlyPayment
                    )} pro VŠECHNY měsíce (září až červen)?`
                  )
                ) {
                  onApplyPaymentToAllMonths(settings.monthlyPayment);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
              title={`Sjednotí všechny měsíce na ${formatCzk(settings.monthlyPayment)}`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Sjednotit všechny měsíce na {formatCzk(settings.monthlyPayment)}</span>
            </button>

            <button
              onClick={() => setShowAddExtra(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mimořádný vklad / vratka</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                <th className="py-3 px-4">Měsíc</th>
                <th className="py-3 px-4">Částka platby</th>
                <th className="py-3 px-4 text-center">Stav platby</th>
                <th className="py-3 px-4 text-right">Odebráno</th>
                <th className="py-3 px-4 text-right">Odhlášeno</th>
                <th className="py-3 px-4 text-right">Skutečné náklady</th>
                <th className="py-3 px-4 text-right">Měsíční bilance</th>
                <th className="py-3 px-3 text-center">Úprava</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {schoolMonths.map((m) => {
                const pay = payments[m.key];
                const summary = computeMonthSummary(
                  m.year,
                  m.monthIndex,
                  settings,
                  records,
                  pay,
                  todayIso
                );

                const isPaid = pay?.paid ?? false;
                const currentMonthAmount = pay?.actualAmount ?? pay?.plannedAmount ?? settings.monthlyPayment;
                const paidAmount = isPaid ? currentMonthAmount : 0;
                const monthDiff = isPaid ? paidAmount - summary.totalCost : -summary.totalCost;

                return (
                  <tr key={m.key} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      <div>{m.label}</div>
                      {pay?.note && (
                        <div className="text-[10px] text-stone-500 font-normal italic">
                          {pay.note}
                        </div>
                      )}
                    </td>

                    {/* Editable Payment Amount */}
                    <td className="py-3 px-4 font-mono">
                      <button
                        onClick={() => openEditPayment(m.key)}
                        className="group inline-flex items-center gap-1.5 font-bold text-stone-900 hover:text-amber-700 py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-amber-50/80 transition-colors"
                        title="Klikněte pro změnu částky"
                      >
                        <span>{formatCzk(currentMonthAmount)}</span>
                        <Pencil className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>

                    {/* Paid Toggle Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onTogglePaymentPaid(m.key)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                        title="Kliknutím přepnete zda platba odešla"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isPaid ? 'text-emerald-600' : 'text-stone-400'
                          }`}
                        />
                        <span>{isPaid ? 'Odesláno' : 'Neodesláno'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {summary.eatenCount} dní
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-sky-700">
                      {summary.canceledCount} dní
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-stone-900">
                      {formatCzk(summary.totalCost)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {isPaid ? (
                        <span className={monthDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {monthDiff >= 0 ? '+' : ''}
                          {formatCzk(monthDiff)}
                        </span>
                      ) : (
                        <span className="text-stone-400 font-normal">
                          čeká na platbu
                        </span>
                      )}
                    </td>

                    {/* Edit button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => openEditPayment(m.key)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
                        title="Upravit platbu za tento měsíc"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Month Payment Modal */}
      {editingMonthKey && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Upravit platbu za {schoolMonths.find((m) => m.key === editingMonthKey)?.label}
                </h3>
                <p className="text-xs text-stone-500">
                  Zadejte skutečnou částku, která za tento měsíc odešla nebo má odejít.
                </p>
              </div>
              <button
                onClick={() => setEditingMonthKey(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Částka měsíční platby (Kč)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-base font-mono font-bold text-stone-900 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Např. 683 Kč (můžete zadat přesnou částku na koruny)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Stav platby
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditPaymentPaid(true)}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                      editPaymentPaid
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Odesláno z banky ✔️
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentPaid(false)}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                      !editPaymentPaid
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    Čeká na odeslání
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Poznámka k platbě (nepovinné)
                </label>
                <input
                  type="text"
                  placeholder="Např. Platba z účtu mBank, variabilní symbol 4208"
                  value={editPaymentNote}
                  onChange={(e) => setEditPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-800"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleApplyCurrentToAll}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nastavit {formatCzk(parseFloat(editPaymentAmount) || 0)} pro VŠECHNY měsíce</span>
                </button>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingMonthKey(null)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 shadow-2xs"
                  >
                    Uložit pro tento měsíc
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Payments List */}
      {extraPayments.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-3">
            Mimořádné vklady a vratky ({extraPayments.length})
          </h3>
          <div className="divide-y divide-stone-200">
            {extraPayments.map((extra) => (
              <div key={extra.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-semibold text-stone-900">{extra.note}</div>
                  <div className="text-stone-500 text-xs">Datum: {extra.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold ${
                      extra.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {extra.amount >= 0 ? '+' : ''}
                    {formatCzk(extra.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteExtraPayment(extra.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Smazat mimořádnou platbu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Extra Payment Modal */}
      {showAddExtra && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              Přidat mimořádnou platbu / vratku
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Např. vklad hotovosti u vedoucí jídelny, nebo vrácený přeplatek během roku.
            </p>

            <form onSubmit={handleSaveExtra} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Typ operace</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraType('deposit')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center ${
                      extraType === 'deposit'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    + Mimořádný vklad (připsáno)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraType('refund')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center ${
                      extraType === 'refund'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    - Vratka od školy (odepsáno)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Částka (Kč)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Datum</label>
                <input
                  type="date"
                  required
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Popis / poznámka</label>
                <input
                  type="text"
                  placeholder="Např. Hotovost vedoucí školní jídelny"
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExtra(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-50"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
                >
                  Uložit platbu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
