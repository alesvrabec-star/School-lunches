import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palmtree,
  Calendar as CalendarIcon,
  Sparkles,
  MessageSquare,
  CheckCheck,
  CalendarRange,
  Columns2,
  CalendarDays,
} from 'lucide-react';
import {
  DayStatus,
  LunchRecord,
  AppSettings,
  MonthlyPaymentRecord,
} from '../types/lunch';
import {
  getSchoolMonths,
  getMonthDays,
  formatCzechMonthYear,
  formatDateToIso,
  formatCzk,
} from '../utils/czechCalendar';
import { computeMonthSummary } from '../utils/storage';

interface FridgeCalendarProps {
  selectedMonthKey: string;
  setSelectedMonthKey: (key: string) => void;
  records: Record<string, LunchRecord>;
  payments: Record<string, MonthlyPaymentRecord>;
  settings: AppSettings;
  todayIso: string;
  onOpenDayModal: (dateStr: string) => void;
  onOpenBatchModal: () => void;
  onBulkFillMonth: (year: number, monthIndex: number) => void;
}

export const FridgeCalendar: React.FC<FridgeCalendarProps> = ({
  selectedMonthKey,
  setSelectedMonthKey,
  records,
  payments,
  settings,
  todayIso,
  onOpenDayModal,
  onOpenBatchModal,
  onBulkFillMonth,
}) => {
  // Mobile defaults to school days only (Po-Pá) for 40% wider touch targets
  const [showWeekends, setShowWeekends] = useState(false);

  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);
  const currentMonthOption =
    schoolMonths.find((m) => m.key === selectedMonthKey) || schoolMonths[0];

  const year = currentMonthOption.year;
  const monthIndex = currentMonthOption.monthIndex;

  const allDays = getMonthDays(year, monthIndex);
  const payment = payments[selectedMonthKey];
  const summary = computeMonthSummary(year, monthIndex, settings, records, payment, todayIso);

  // Filter days if school days only
  const displayedDays = showWeekends ? allDays : allDays.filter((d) => !d.isWeekend);

  // Compute padding days
  // firstDayOfWeek: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
  const firstDayOfWeek = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const emptyPaddingDaysCount = showWeekends
    ? firstDayOfWeek
    : firstDayOfWeek >= 5
    ? 0 // If 1st is Sat/Sun, first school day is Monday, so 0 padding
    : firstDayOfWeek;

  const emptyPaddingDays = Array.from({ length: emptyPaddingDaysCount });

  const currentIndex = schoolMonths.findIndex((m) => m.key === selectedMonthKey);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < schoolMonths.length - 1;

  const handlePrev = () => {
    if (canGoPrev) setSelectedMonthKey(schoolMonths[currentIndex - 1].key);
  };

  const handleNext = () => {
    if (canGoNext) setSelectedMonthKey(schoolMonths[currentIndex + 1].key);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Month Navigation & Toolbar Bar */}
      <div className="p-3 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="p-1.5 sm:p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Předchozí měsíc"
                aria-label="Předchozí měsíc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="p-1.5 sm:p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Další měsíc"
                aria-label="Další měsíc"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base sm:text-xl font-bold text-stone-900 leading-tight">
                {formatCzechMonthYear(year, monthIndex)}
              </h3>
              <span className="text-[11px] sm:text-xs text-stone-500">
                Školní rok {settings.schoolYear}
              </span>
            </div>
          </div>

          {/* 5-day vs 7-day Toggle Button (Mobile Friendly) */}
          <button
            onClick={() => setShowWeekends(!showWeekends)}
            className={`md:hidden px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              !showWeekends
                ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                : 'bg-white border-stone-300 text-stone-700'
            }`}
            title="Přepnout zobrazení školních dnů a víkendů"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{!showWeekends ? 'Po–Pá' : 'Po–Ne'}</span>
          </button>
        </div>

        {/* Quick Month Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-1 px-1">
          {schoolMonths.map((m) => {
            const isSelected = m.key === selectedMonthKey;
            const shortName = m.label.split(' ')[0].slice(0, 3);
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonthKey(m.key)}
                className={`px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Metrics Summary Card (Compact on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 bg-white border-b border-stone-200 text-xs">
        <div className="p-2.5 sm:p-4 text-center">
          <div className="text-stone-500 text-[10px] sm:text-xs uppercase font-semibold">Odebráno</div>
          <div className="text-sm sm:text-xl font-bold text-emerald-700 mt-0.5">
            {summary.eatenCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-stone-400">
              / {summary.totalSchoolDays} dní
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-500 font-mono">
            {formatCzk(summary.costEaten)}
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center">
          <div className="text-stone-500 text-[10px] sm:text-xs uppercase font-semibold">Odhlášeno</div>
          <div className="text-sm sm:text-xl font-bold text-sky-700 mt-0.5">
            {summary.canceledCount} obědů
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold font-mono">
            +{formatCzk(summary.canceledCount * settings.pricePerLunch)}
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center">
          <div className="text-stone-500 text-[10px] sm:text-xs uppercase font-semibold">Trvalý příkaz</div>
          <div className="text-sm sm:text-xl font-bold text-stone-900 mt-0.5 font-mono">
            {formatCzk(payment?.actualAmount ?? payment?.plannedAmount ?? settings.monthlyPayment)}
          </div>
          <div className="text-[10px] sm:text-[11px]">
            {payment?.paid ? (
              <span className="text-emerald-700 font-semibold">Odesláno ✔️</span>
            ) : (
              <span className="text-stone-400">Čeká</span>
            )}
          </div>
        </div>

        <div className="p-2.5 sm:p-4 text-center">
          <div className="text-stone-500 text-[10px] sm:text-xs uppercase font-semibold">Bilance měsíce</div>
          <div
            className={`text-sm sm:text-xl font-bold mt-0.5 font-mono ${
              summary.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {summary.difference >= 0 ? '+' : ''}
            {formatCzk(summary.difference)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-500">
            {summary.difference >= 0 ? 'Přeplatek' : 'Nedoplatek'}
          </div>
        </div>
      </div>

      {/* Calendar Grid Header (5 or 7 columns) */}
      <div
        className={`grid ${
          showWeekends ? 'grid-cols-7' : 'grid-cols-5'
        } border-b border-stone-200 bg-stone-100/70 text-center text-[11px] sm:text-xs font-bold text-stone-700 py-1.5 sm:py-2`}
      >
        <div>Po</div>
        <div>Út</div>
        <div>St</div>
        <div>Čt</div>
        <div>Pá</div>
        {showWeekends && (
          <>
            <div className="text-stone-400">So</div>
            <div className="text-stone-400">Ne</div>
          </>
        )}
      </div>

      {/* Calendar Grid Days */}
      <div
        className={`grid ${
          showWeekends ? 'grid-cols-7' : 'grid-cols-5'
        } divide-x divide-y divide-stone-200 bg-stone-100`}
      >
        {/* Padding empty slots */}
        {emptyPaddingDays.map((_, i) => (
          <div
            key={`empty-${i}`}
            className="bg-stone-50/50 min-h-[58px] sm:min-h-[88px]"
          />
        ))}

        {/* Real Days */}
        {displayedDays.map((day) => {
          const rec = records[day.dateStr];
          const isToday = day.dateStr === todayIso;
          const isPast = day.dateStr < todayIso;

          const status: DayStatus =
            rec?.status ||
            (day.isHoliday ? 'holiday' : 'unmarked');

          let cellBg = 'bg-white';
          let borderHighlight = '';
          let statusBadge = null;

          if (day.isWeekend) {
            cellBg = 'bg-stone-50/60 text-stone-400';
          } else if (day.isHoliday) {
            cellBg = 'bg-amber-50/40 text-stone-600';
            statusBadge = (
              <div
                className="text-[9px] sm:text-[11px] font-medium text-amber-900 bg-amber-100/80 px-1 py-0.5 rounded truncate"
                title={day.holidayName}
              >
                🏖️ <span className="hidden sm:inline">{day.holidayName || 'Volno'}</span>
                <span className="sm:hidden">Volno</span>
              </div>
            );
          } else if (status === 'eaten') {
            cellBg = 'bg-emerald-50/40';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded flex items-center justify-center gap-0.5 sm:gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate hidden sm:inline">Odebráno</span>
                <span className="truncate sm:hidden">Byl</span>
              </div>
            );
          } else if (status === 'canceled') {
            cellBg = 'bg-sky-50/40';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-bold text-sky-800 bg-sky-100 px-1 py-0.5 rounded flex items-center justify-center gap-0.5 sm:gap-1">
                <XCircle className="w-3 h-3 text-sky-600 shrink-0" />
                <span className="truncate hidden sm:inline">Odhlášeno</span>
                <span className="truncate sm:hidden">Odhl.</span>
              </div>
            );
          } else if (status === 'missed') {
            cellBg = 'bg-amber-50/50';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-bold text-amber-900 bg-amber-100 px-1 py-0.5 rounded flex items-center justify-center gap-0.5 sm:gap-1">
                <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                <span className="truncate">Propadl</span>
              </div>
            );
          } else if (isPast) {
            cellBg = 'bg-rose-50/30';
            statusBadge = (
              <div className="text-[9px] sm:text-xs font-medium text-stone-500 bg-stone-100 px-1 py-0.5 rounded text-center truncate">
                Nezadáno
              </div>
            );
          } else {
            statusBadge = (
              <div className="text-[9px] sm:text-xs text-stone-400 font-normal text-center truncate">
                —
              </div>
            );
          }

          if (isToday) {
            borderHighlight = 'ring-2 ring-inset ring-amber-500 shadow-xs';
          }

          return (
            <div
              key={day.dateStr}
              onClick={() => {
                if (!day.isWeekend) onOpenDayModal(day.dateStr);
              }}
              className={`min-h-[58px] sm:min-h-[88px] p-1 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-stone-100/70 ${cellBg} ${borderHighlight}`}
              title={`${day.date.getDate()}. ${formatCzechMonthYear(year, monthIndex)}${
                rec?.note ? `\nPoznámka: ${rec.note}` : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    isToday
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] sm:text-xs'
                      : day.isWeekend
                      ? 'text-stone-400'
                      : 'text-stone-800'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {rec?.note && (
                  <span title={`Poznámka: ${rec.note}`}>
                    <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500 shrink-0" />
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="my-0.5">{statusBadge}</div>

              {/* Price / Note hint */}
              <div className="text-[9px] sm:text-[10px] text-stone-500 truncate flex justify-between items-center">
                {status === 'eaten' && <span>{formatCzk(settings.pricePerLunch)}</span>}
                {status === 'canceled' && <span className="text-emerald-700 font-medium">0 Kč</span>}
                {status === 'missed' && <span className="text-amber-800 font-medium">{formatCzk(settings.pricePerLunch)}</span>}
                {rec?.note && (
                  <span className="truncate text-stone-600 font-medium ml-1 hidden sm:inline">
                    {rec.note}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Month Actions Toolbar */}
      <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBulkFillMonth(year, monthIndex)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 font-semibold shadow-2xs text-[11px] sm:text-xs"
            title="Nastaví všechny všední dny v tomto měsíci jako snězené"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Označit všední dny jako snězené</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeekends(!showWeekends)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-[11px] sm:text-xs"
          >
            <Columns2 className="w-3.5 h-3.5 text-stone-500" />
            <span>{showWeekends ? 'Skrýt víkendy (Po–Pá)' : 'Zobrazit víkendy (7 dní)'}</span>
          </button>

          <button
            onClick={onOpenBatchModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 font-semibold shadow-2xs text-[11px] sm:text-xs"
          >
            <CalendarRange className="w-3.5 h-3.5 text-sky-600" />
            <span>Odhlásit dny...</span>
          </button>
        </div>
      </div>
    </div>
  );
};
