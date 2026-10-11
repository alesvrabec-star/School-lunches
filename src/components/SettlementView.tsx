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
  onUpdatePaymentAmount: (monthKey: string, amount: number) => void;
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

  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);

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
  // Total school days in year is around 196
  let totalYearSchoolDays = 0;
  schoolMonths.forEach((m) => {
    const days = getMonthDays(m.year, m.monthIndex);
    days.forEach((d) => {
      if (!d.isWeekend && !d.isHoliday) totalYearSchoolDays++;
    });
  });
  const recommendedYearTotal = totalYearSchoolDays * settings.pricePerLunch;
  const recommendedMonthly = Math.ceil(recommendedYearTotal / 10 / 10) * 10; // round up to 10s

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
              Evidujete {formatCzk(settings.monthlyPayment)}/měsíc trvalým příkazem. Zde vidíte
              skutečný průběžný stav i kalkulaci toho, co vám škola vrátí nebo naúčtuje na konci roku.
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
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Měsíční rozpis trvalého příkazu ({settings.schoolYear})
            </h3>
            <p className="text-xs text-stone-500">
              Označte, které měsíce již odešly z bankovního účtu, nebo upravte přesnou částku.
            </p>
          </div>

          <button
            onClick={() => setShowAddExtra(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Přidat mimořádnou platbu / vratku</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                <th className="py-3 px-4">Měsíc</th>
                <th className="py-3 px-4">Trvalý příkaz</th>
                <th className="py-3 px-4 text-center">Stav platby</th>
                <th className="py-3 px-4 text-right">Odebráno</th>
                <th className="py-3 px-4 text-right">Odhlášeno</th>
                <th className="py-3 px-4 text-right">Skutečné náklady</th>
                <th className="py-3 px-4 text-right">Měsíční bilance</th>
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
                const paidAmount = isPaid ? (pay?.actualAmount ?? pay?.plannedAmount ?? settings.monthlyPayment) : 0;
                const monthDiff = isPaid ? paidAmount - summary.totalCost : -summary.totalCost;

                return (
                  <tr key={m.key} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {m.label}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {formatCzk(pay?.plannedAmount ?? settings.monthlyPayment)}
                    </td>

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extra Payments List (if any or modal) */}
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
                  min="1"
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
