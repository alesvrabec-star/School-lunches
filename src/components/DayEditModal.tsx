import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palmtree,
  Trash2,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { DayStatus, LunchRecord, AppSettings } from '../types/lunch';
import {
  formatCzechDateLong,
  getDayInfo,
  parseIsoDate,
  formatCzk,
} from '../utils/czechCalendar';

interface DayEditModalProps {
  dateStr: string | null;
  onClose: () => void;
  record?: LunchRecord;
  settings: AppSettings;
  onSave: (dateStr: string, status: DayStatus, note?: string) => void;
  onDelete: (dateStr: string) => void;
}

export const DayEditModal: React.FC<DayEditModalProps> = ({
  dateStr,
  onClose,
  record,
  settings,
  onSave,
  onDelete,
}) => {
  if (!dateStr) return null;

  const dayInfo = getDayInfo(parseIsoDate(dateStr));
  const [selectedStatus, setSelectedStatus] = useState<DayStatus>(
    record?.status || (dayInfo.isHoliday ? 'holiday' : 'eaten')
  );
  const [note, setNote] = useState<string>(record?.note || '');

  useEffect(() => {
    setSelectedStatus(record?.status || (dayInfo.isHoliday ? 'holiday' : 'eaten'));
    setNote(record?.note || '');
  }, [dateStr, record]);

  const quickNotes = [
    'Nemoc / nachlazení',
    'Návštěva lékaře / zubař',
    'Škola v přírodě',
    'Ředitelské volno',
    'Rodinné důvody',
  ];

  const handleSave = () => {
    onSave(dateStr, selectedStatus, note.trim() || undefined);
    onClose();
  };

  const handleDelete = () => {
    onDelete(dateStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-base capitalize">
                {formatCzechDateLong(dateStr)}
              </h3>
              <p className="text-xs text-stone-500">
                {settings.child.name} · {settings.child.schoolName || 'Škola'}
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

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
              Stav oběda pro tento den:
            </label>

            <div className="space-y-2">
              {/* EATEN */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedStatus === 'eaten'
                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === 'eaten'}
                    onChange={() => setSelectedStatus('eaten')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Byl na obědě (odebráno)</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Naúčtuje se cena za oběd
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-800">
                  {formatCzk(settings.pricePerLunch)}
                </span>
              </label>

              {/* CANCELED */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedStatus === 'canceled'
                    ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-500'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === 'canceled'}
                    onChange={() => setSelectedStatus('canceled')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-sky-600" />
                      <span>Odhlášeno včas (nemoc / omluva)</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Jídelna neúčtuje, ušetřeno
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-600">
                  0 Kč
                </span>
              </label>

              {/* MISSED */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedStatus === 'missed'
                    ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === 'missed'}
                    onChange={() => setSelectedStatus('missed')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Neodhlášen (propadl)</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Syn nebyl, ale oběd byl uvařen a naúčtován
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-amber-800">
                  {formatCzk(settings.pricePerLunch)}
                </span>
              </label>

              {/* HOLIDAY */}
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedStatus === 'holiday'
                    ? 'bg-stone-100 border-stone-400 ring-1 ring-stone-400'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="status"
                    checked={selectedStatus === 'holiday'}
                    onChange={() => setSelectedStatus('holiday')}
                    className="text-stone-600 focus:ring-stone-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Palmtree className="w-4 h-4 text-stone-500" />
                      <span>Prázdniny / ředitelské volno</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Jídelna nevaří
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-stone-500">
                  0 Kč
                </span>
              </label>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
              <span>Poznámka / důvod (nepovinné):</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Např. zubař, výlet se třídou, nevolnost..."
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotes.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          {record ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Smazat záznam</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-300 text-stone-700 hover:bg-white"
            >
              Zrušit
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-2xs"
            >
              Uložit den
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
