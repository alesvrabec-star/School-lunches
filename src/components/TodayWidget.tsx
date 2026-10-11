import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palmtree,
  CalendarRange,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { DayStatus, LunchRecord, AppSettings } from '../types/lunch';
import {
  formatCzechDateLong,
  formatDateToIso,
  getDayInfo,
  formatCzk,
} from '../utils/czechCalendar';

interface TodayWidgetProps {
  todayIso: string;
  records: Record<string, LunchRecord>;
  settings: AppSettings;
  onSetStatus: (dateStr: string, status: DayStatus, note?: string) => void;
  onOpenBatchModal: () => void;
  onOpenDayModal: (dateStr: string) => void;
}

export const TodayWidget: React.FC<TodayWidgetProps> = ({
  todayIso,
  records,
  settings,
  onSetStatus,
  onOpenBatchModal,
  onOpenDayModal,
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const todayDate = new Date();
  const todayInfo = getDayInfo(todayDate);
  const todayRecord = records[todayIso];
  const currentStatus = todayRecord?.status || 'unmarked';

  // Calculate yesterday date and info
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = formatDateToIso(yesterday);
  const yesterdayInfo = getDayInfo(yesterday);
  const yesterdayRecord = records[yesterdayIso];
  const showYesterdayPrompt =
    yesterdayInfo.isSchoolDay && (!yesterdayRecord || yesterdayRecord.status === 'unmarked');

  // Calculate current week days (Monday to Friday)
  const currentDayOfWeek = todayDate.getDay(); // 0 is Sun, 1 is Mon...
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const currentWeekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + mondayOffset + offset);
    const iso = formatDateToIso(d);
    const info = getDayInfo(d);
    return {
      iso,
      info,
      record: records[iso],
      isToday: iso === todayIso,
    };
  });

  const handleStatusClick = (status: DayStatus) => {
    onSetStatus(todayIso, status, noteText || todayRecord?.note);
    setShowNoteInput(false);
  };

  const saveNote = () => {
    onSetStatus(todayIso, currentStatus === 'unmarked' ? 'eaten' : currentStatus, noteText);
    setShowNoteInput(false);
  };

  return (
    <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Dnešní zápis na lednici</span>
            {todayInfo.isWeekend && (
              <span className="text-stone-500 font-normal">· Víkend</span>
            )}
            {todayInfo.isHoliday && (
              <span className="text-amber-700 font-normal">· {todayInfo.holidayName}</span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 capitalize">
            {formatCzechDateLong(todayIso)}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Měl dnes <span className="font-semibold text-stone-900">{settings.child.name}</span> oběd ve školní jídelně?
          </p>
        </div>

        {/* Action badges & Batch Cancel CTA */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenBatchModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors shadow-2xs"
          >
            <CalendarRange className="w-4 h-4 text-stone-500" />
            <span>Odhlásit více dní (nemoc)</span>
          </button>
        </div>
      </div>

      {/* Primary 1-Click Action Buttons for Today */}
      <div className="pt-4">
        {todayInfo.isWeekend ? (
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center text-stone-600">
            <Palmtree className="w-6 h-6 mx-auto mb-1 text-stone-400" />
            <p className="text-sm font-medium text-stone-800">Dnes je víkend, školní jídelna nevaří.</p>
            <p className="text-xs text-stone-500 mt-1">
              Můžete si zkontrolovat přehled týdne níže nebo naplánovat odhlášky na příští dny.
            </p>
          </div>
        ) : todayInfo.isHoliday ? (
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center text-stone-600">
            <Palmtree className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <p className="text-sm font-medium text-stone-800">Dnes jsou prázdniny nebo státní svátek: {todayInfo.holidayName}</p>
            <p className="text-xs text-stone-500 mt-1">Oběd se samozřejmě neúčtuje.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* EATEN BUTTON */}
              <button
                type="button"
                onClick={() => handleStatusClick('eaten')}
                className={`relative flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-4 rounded-xl border text-left sm:text-center transition-all ${
                  currentStatus === 'eaten'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white text-stone-800 border-stone-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 shrink-0 ${
                    currentStatus === 'eaten'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">Byl na obědě</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      currentStatus === 'eaten' ? 'text-emerald-100' : 'text-stone-500'
                    }`}
                  >
                    Odebráno ({formatCzk(settings.pricePerLunch)})
                  </div>
                </div>
                {currentStatus === 'eaten' && (
                  <span className="ml-auto sm:ml-0 sm:mt-2 text-[11px] font-semibold bg-emerald-700/60 text-white px-2 py-0.5 rounded-full">
                    Aktivní stav
                  </span>
                )}
              </button>

              {/* CANCELED BUTTON */}
              <button
                type="button"
                onClick={() => handleStatusClick('canceled')}
                className={`relative flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-4 rounded-xl border text-left sm:text-center transition-all ${
                  currentStatus === 'canceled'
                    ? 'bg-sky-700 text-white border-sky-800 shadow-sm ring-2 ring-sky-500/20'
                    : 'bg-white text-stone-800 border-stone-300 hover:border-sky-400 hover:bg-sky-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 shrink-0 ${
                    currentStatus === 'canceled'
                      ? 'bg-sky-800 text-white'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">Odhlášeno / Nemoc</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      currentStatus === 'canceled' ? 'text-sky-100' : 'text-stone-500'
                    }`}
                  >
                    0 Kč (Ušetřeno)
                  </div>
                </div>
                {currentStatus === 'canceled' && (
                  <span className="ml-auto sm:ml-0 sm:mt-2 text-[11px] font-semibold bg-sky-800/60 text-white px-2 py-0.5 rounded-full">
                    Aktivní stav
                  </span>
                )}
              </button>

              {/* MISSED UNEXCUSED BUTTON */}
              <button
                type="button"
                onClick={() => handleStatusClick('missed')}
                className={`relative flex items-center sm:flex-col sm:justify-center p-3.5 sm:p-4 rounded-xl border text-left sm:text-center transition-all ${
                  currentStatus === 'missed'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-white text-stone-800 border-stone-300 hover:border-amber-400 hover:bg-amber-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 shrink-0 ${
                    currentStatus === 'missed'
                      ? 'bg-amber-800 text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base">Neodhlášen (propadl)</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      currentStatus === 'missed' ? 'text-amber-100' : 'text-stone-500'
                    }`}
                  >
                    Škola účtuje ({formatCzk(settings.pricePerLunch)})
                  </div>
                </div>
                {currentStatus === 'missed' && (
                  <span className="ml-auto sm:ml-0 sm:mt-2 text-[11px] font-semibold bg-amber-800/60 text-white px-2 py-0.5 rounded-full">
                    Aktivní stav
                  </span>
                )}
              </button>
            </div>

            {/* Note row for today */}
            <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
              {todayRecord?.note ? (
                <div className="flex items-center gap-1.5 text-stone-700 bg-white border border-stone-200 px-3 py-1.5 rounded-lg">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                  <span>Poznámka k dnešku: <strong className="font-medium">{todayRecord.note}</strong></span>
                  <button
                    onClick={() => {
                      setNoteText(todayRecord.note || '');
                      setShowNoteInput(true);
                    }}
                    className="text-amber-700 hover:underline ml-1 font-semibold"
                  >
                    změnit
                  </button>
                </div>
              ) : showNoteInput ? (
                <div className="flex items-center gap-2 w-full max-w-md">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Např. Kontrola u lékaře, výlet, řízek..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    onClick={saveNote}
                    className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
                  >
                    Uložit
                  </button>
                  <button
                    onClick={() => setShowNoteInput(false)}
                    className="px-2 py-1.5 text-stone-500 hover:text-stone-700 text-xs"
                  >
                    Zrušit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="inline-flex items-center gap-1 text-stone-500 hover:text-amber-700 text-xs font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Přidat k dnešku poznámku</span>
                </button>
              )}

              {currentStatus !== 'unmarked' && (
                <button
                  onClick={() => onSetStatus(todayIso, 'unmarked')}
                  className="text-stone-400 hover:text-rose-600 transition-colors"
                  title="Smazat dnešní zápis"
                >
                  Zrušit dnešní záznam
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Missing Yesterday Warning banner (if parent forgot to mark yesterday) */}
      {showYesterdayPrompt && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Zapomněli jste včera zapsat oběd? (<strong>{formatCzechDateLong(yesterdayIso)}</strong>)
            </span>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => onSetStatus(yesterdayIso, 'eaten')}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 text-xs"
            >
              Byl na obědě
            </button>
            <button
              onClick={() => onSetStatus(yesterdayIso, 'canceled')}
              className="px-2.5 py-1 bg-sky-700 text-white rounded-lg font-semibold hover:bg-sky-800 text-xs"
            >
              Byl odhlášen
            </button>
            <button
              onClick={() => onOpenDayModal(yesterdayIso)}
              className="px-2 py-1 text-stone-600 hover:text-stone-900 text-xs underline"
            >
              Upravit
            </button>
          </div>
        </div>
      )}

      {/* Current Week Quick Strip (Po až Pá) */}
      <div className="mt-5 pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Tento týden (Po – Pá)
          </span>
          <span className="text-xs text-stone-500">Kliknutím na den stav změníte</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {currentWeekDays.map(({ iso, info, record, isToday }) => {
            const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
            const status = record?.status || (info.isHoliday ? 'holiday' : 'unmarked');

            let badgeBg = 'bg-stone-100 text-stone-500 border-stone-200';
            let label = 'Nezadáno';

            if (status === 'eaten') {
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
              label = 'Byl';
            } else if (status === 'canceled') {
              badgeBg = 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
              label = 'Odhl.';
            } else if (status === 'missed') {
              badgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
              label = 'Propadl';
            } else if (status === 'holiday') {
              badgeBg = 'bg-stone-100 text-stone-500 border-stone-200';
              label = 'Volno';
            }

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onOpenDayModal(iso)}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${
                  isToday
                    ? 'ring-2 ring-stone-900 bg-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-stone-200'
                }`}
                title={`${formatCzechDateLong(iso)} - klikněte pro úpravu`}
              >
                <div className="text-[11px] font-semibold text-stone-500">
                  {dayNames[info.dayOfWeek]}
                </div>
                <div className="text-sm sm:text-base font-bold text-stone-900 my-0.5">
                  {info.date.getDate()}.
                </div>
                <div
                  className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border w-full truncate ${badgeBg}`}
                >
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
