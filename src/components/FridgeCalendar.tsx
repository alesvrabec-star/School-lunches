import React from 'react';
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
  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);
  const currentMonthOption =
    schoolMonths.find((m) => m.key === selectedMonthKey) || schoolMonths[0];

  const year = currentMonthOption.year;
  const monthIndex = currentMonthOption.monthIndex;

  const days = getMonthDays(year, monthIndex);
  const payment = payments[selectedMonthKey];
  const summary = computeMonthSummary(year, monthIndex, settings, records, payment, todayIso);

  // Determine starting weekday of the month (Monday = 0, Sunday = 6)
  const firstDayOfWeek = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday = 0
  const emptyPaddingDays = Array.from({ length: firstDayOfWeek });

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
      {/* Month Navigation Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Předchozí měsíc"
              aria-label="Předchozí měsíc"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Další měsíc"
              aria-label="Další měsíc"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              {formatCzechMonthYear(year, monthIndex)}
            </h3>
            <span className="text-xs text-stone-500">
              Školní rok {settings.schoolYear}
            </span>
          </div>
        </div>

        {/* Quick Month Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {schoolMonths.map((m) => {
            const isSelected = m.key === selectedMonthKey;
            const shortName = m.label.split(' ')[0].slice(0, 3);
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonthKey(m.key)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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

      {/* Monthly Metrics Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 bg-white border-b border-stone-200 text-xs sm:text-sm">
        <div className="p-3 sm:p-4 text-center">
          <div className="text-stone-500 text-xs uppercase font-semibold">Odebrané obědy</div>
          <div className="text-base sm:text-xl font-bold text-emerald-700 mt-0.5">
            {summary.eatenCount}{' '}
            <span className="text-xs font-normal text-stone-400">
              / {summary.totalSchoolDays} dní
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-mono">
            {formatCzk(summary.costEaten)}
          </div>
        </div>

        <div className="p-3 sm:p-4 text-center">
          <div className="text-stone-500 text-xs uppercase font-semibold">Odhlášeno (ušetřeno)</div>
          <div className="text-base sm:text-xl font-bold text-sky-700 mt-0.5">
            {summary.canceledCount} obědů
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 font-mono">
            +{formatCzk(summary.canceledCount * settings.pricePerLunch)} ušetřeno
          </div>
        </div>

        <div className="p-3 sm:p-4 text-center">
          <div className="text-stone-500 text-xs uppercase font-semibold">Trvalý příkaz</div>
          <div className="text-base sm:text-xl font-bold text-stone-900 mt-0.5 font-mono">
            {formatCzk(payment?.plannedAmount || settings.monthlyPayment)}
          </div>
          <div className="text-[11px] mt-0.5">
            {payment?.paid ? (
              <span className="text-emerald-700 font-semibold">Odesláno ✔️</span>
            ) : (
              <span className="text-stone-400">Čeká na odeslání</span>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 text-center">
          <div className="text-stone-500 text-xs uppercase font-semibold">Měsíční bilance</div>
          <div
            className={`text-base sm:text-xl font-bold mt-0.5 font-mono ${
              summary.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {summary.difference >= 0 ? '+' : ''}
            {formatCzk(summary.difference)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {summary.difference >= 0 ? 'Zůstává k dobru' : 'Převyšuje zálohu'}
          </div>
        </div>
      </div>

      {/* Calendar Grid Header */}
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100/70 text-center text-xs font-bold text-stone-700 py-2">
        <div>Po</div>
        <div>Út</div>
        <div>St</div>
        <div>Čt</div>
        <div>Pá</div>
        <div className="text-stone-400">So</div>
        <div className="text-stone-400">Ne</div>
      </div>

      {/* Calendar Grid Days */}
      <div className="grid grid-cols-7 divide-x divide-y divide-stone-200 bg-stone-100">
        {/* Padding empty slots */}
        {emptyPaddingDays.map((_, i) => (
          <div key={`empty-${i}`} className="bg-stone-50/50 min-h-[72px] sm:min-h-[96px]" />
        ))}

        {/* Real Days */}
        {days.map((day) => {
          const rec = records[day.dateStr];
          const isToday = day.dateStr === todayIso;
          const isPast = day.dateStr < todayIso;
          const isFuture = day.dateStr > todayIso;

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
              <div className="text-[10px] sm:text-[11px] font-medium text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded truncate" title={day.holidayName}>
                🏖️ {day.holidayName || 'Volno'}
              </div>
            );
          } else if (status === 'eaten') {
            cellBg = 'bg-emerald-50/40';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">Odebráno</span>
              </div>
            );
          } else if (status === 'canceled') {
            cellBg = 'bg-sky-50/40';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-semibold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3 text-sky-600 shrink-0" />
                <span className="truncate">Odhlášeno</span>
              </div>
            );
          } else if (status === 'missed') {
            cellBg = 'bg-amber-50/50';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-semibold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                <span className="truncate">Propadl</span>
              </div>
            );
          } else if (isPast) {
            cellBg = 'bg-rose-50/30';
            statusBadge = (
              <div className="text-[10px] sm:text-xs font-medium text-stone-500 bg-stone-100 px-1 py-0.5 rounded text-center truncate">
                Nezadáno
              </div>
            );
          } else {
            statusBadge = (
              <div className="text-[10px] sm:text-xs text-stone-400 font-normal text-center truncate">
                Plánováno
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
              className={`min-h-[72px] sm:min-h-[96px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-stone-100/70 ${cellBg} ${borderHighlight}`}
              title={`${day.date.getDate()}. ${formatCzechMonthYear(year, monthIndex)}${
                rec?.note ? `\nPoznámka: ${rec.note}` : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center'
                      : day.isWeekend
                      ? 'text-stone-400'
                      : 'text-stone-800'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {rec?.note && (
                  <span title={`Poznámka: ${rec.note}`}>
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="my-1">{statusBadge}</div>

              {/* Price / Note hint */}
              <div className="text-[10px] text-stone-500 truncate flex justify-between items-center">
                {status === 'eaten' && <span>{formatCzk(settings.pricePerLunch)}</span>}
                {status === 'canceled' && <span className="text-emerald-700">0 Kč</span>}
                {status === 'missed' && <span className="text-amber-800">{formatCzk(settings.pricePerLunch)}</span>}
                {rec?.note && (
                  <span className="truncate text-stone-600 font-medium ml-1">
                    {rec.note}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Month Actions Toolbar */}
      <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Rychlé akce pro tento měsíc:</span>
          <button
            onClick={() => onBulkFillMonth(year, monthIndex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 font-semibold shadow-2xs"
            title="Nastaví všechny všední dny v tomto měsíci jako snězené"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Označit všechny všední dny jako snězené</span>
          </button>
        </div>

        <button
          onClick={onOpenBatchModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 font-semibold shadow-2xs"
        >
          <CalendarRange className="w-3.5 h-3.5 text-sky-600" />
          <span>Hromadně odhlásit dny...</span>
        </button>
      </div>
    </div>
  );
};
