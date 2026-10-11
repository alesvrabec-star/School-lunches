import React, { useState } from 'react';
import {
  X,
  CalendarRange,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palmtree,
  Sparkles,
} from 'lucide-react';
import { DayStatus, AppSettings } from '../types/lunch';
import {
  formatDateToIso,
  parseIsoDate,
  getDayInfo,
  formatCzk,
} from '../utils/czechCalendar';

interface BatchCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  todayIso: string;
  onApplyBatch: (
    startDateIso: string,
    endDateIso: string,
    status: DayStatus,
    note?: string
  ) => void;
}

export const BatchCancelModal: React.FC<BatchCancelModalProps> = ({
  isOpen,
  onClose,
  settings,
  todayIso,
  onApplyBatch,
}) => {
  if (!isOpen) return null;

  // Defaults: from today until Friday of current week (or next 5 days)
  const today = parseIsoDate(todayIso);
  const fridayOffset = 5 - today.getDay(); // days until Friday
  const defaultEnd = new Date(today);
  if (fridayOffset > 0) {
    defaultEnd.setDate(today.getDate() + fridayOffset);
  } else {
    defaultEnd.setDate(today.getDate() + 4);
  }

  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(formatDateToIso(defaultEnd));
  const [status, setStatus] = useState<DayStatus>('canceled');
  const [note, setNote] = useState('Nemoc / omluveno');

  // Calculate count of affected school days
  const calculateAffectedDays = () => {
    if (!startDate || !endDate || startDate > endDate) return [];
    const list: string[] = [];
    const cur = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);

    while (cur <= end) {
      const info = getDayInfo(cur);
      if (!info.isWeekend && !info.isHoliday) {
        list.push(info.dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  };

  const affectedDays = calculateAffectedDays();
  const savedOrChargedAmount = affectedDays.length * settings.pricePerLunch;

  // Quick preset buttons
  const applyPresetThisWeek = () => {
    const cur = parseIsoDate(todayIso);
    setStartDate(todayIso);
    const fri = new Date(cur);
    const offset = 5 - cur.getDay();
    fri.setDate(cur.getDate() + (offset >= 0 ? offset : 4));
    setEndDate(formatDateToIso(fri));
  };

  const applyPresetNextWeek = () => {
    const cur = parseIsoDate(todayIso);
    const nextMon = new Date(cur);
    const day = cur.getDay();
    const daysToNextMon = (8 - day) % 7 || 7;
    nextMon.setDate(cur.getDate() + daysToNextMon);

    const nextFri = new Date(nextMon);
    nextFri.setDate(nextMon.getDate() + 4);

    setStartDate(formatDateToIso(nextMon));
    setEndDate(formatDateToIso(nextFri));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || startDate > endDate) return;
    onApplyBatch(startDate, endDate, status, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Hromadné zadání / odhlášení na více dní
              </h3>
              <p className="text-xs text-stone-500">
                Ušetřete čas při nemoci nebo delší nepřítomnosti {settings.child.name}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
              Rychlý výběr období:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyPresetThisWeek}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-medium text-stone-700 shadow-2xs"
              >
                Do konce tohoto týdne
              </button>
              <button
                type="button"
                onClick={applyPresetNextWeek}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 font-medium text-stone-700 shadow-2xs"
              >
                Celý příští týden (Po – Pá)
              </button>
            </div>
          </div>

          {/* Date range pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Od data</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Do data (včetně)</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Nastavit stav pro všechny vybrané dny:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatus('canceled')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 ${
                  status === 'canceled'
                    ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-500 font-bold'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <div>Odhlášeno (nemoc)</div>
                  <div className="text-[11px] font-normal text-stone-500">0 Kč (ušetřeno)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('eaten')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 ${
                  status === 'eaten'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 font-bold'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div>Byl na obědě</div>
                  <div className="text-[11px] font-normal text-stone-500">
                    {formatCzk(settings.pricePerLunch)} / den
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Reason note */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Důvod / poznámka (např. nemoc, škola v přírodě)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Např. Nemoc - nachlazení"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Impact preview */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800">
                Počet dotčených školních dní:{' '}
              </span>
              <strong className="text-amber-800 font-bold">{affectedDays.length} dní</strong>
              <div className="text-[11px] text-stone-500">
                (víkendy a státní svátky jsou automaticky vynechány)
              </div>
            </div>

            {status === 'canceled' && (
              <div className="text-right">
                <span className="text-stone-500">Ušetříte:</span>
                <div className="font-bold font-mono text-emerald-700 text-sm">
                  +{formatCzk(savedOrChargedAmount)}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={affectedDays.length === 0}
              className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 disabled:opacity-40 shadow-2xs"
            >
              Použít pro {affectedDays.length} dní
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
