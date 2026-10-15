import React, { useState } from 'react';
import {
  X,
  Settings as SettingsIcon,
  User,
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Cloud,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AppSettings, LunchRecord, MonthlyPaymentRecord, ExtraPayment } from '../types/lunch';
import { FamilyInfo } from '../services/familySync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  records: Record<string, LunchRecord>;
  payments: Record<string, MonthlyPaymentRecord>;
  extraPayments: ExtraPayment[];
  onImportAll: (data: {
    settings: AppSettings;
    records: Record<string, LunchRecord>;
    payments: Record<string, MonthlyPaymentRecord>;
    extraPayments: ExtraPayment[];
  }) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  familyInfo?: FamilyInfo | null;
  onOpenFamilyModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  records,
  payments,
  extraPayments,
  onImportAll,
  onResetDemoData,
  onClearAllData,
  familyInfo,
  onOpenFamilyModal,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [successSaved, setSuccessSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSuccessSaved(true);
    setTimeout(() => {
      setSuccessSaved(false);
      onClose();
    }, 500);
  };

  const handleExportJson = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: form,
      records,
      payments,
      extraPayments,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obednik_zaloha_${form.child.name.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings && parsed.records) {
          onImportAll(parsed);
          alert('Záloha byla úspěšně nahrána!');
          onClose();
        } else {
          alert('Soubor nemá platný formát zálohy Obědníku.');
        }
      } catch (err) {
        alert('Chyba při čtení souboru.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-base">
              Nastavení aplikace a profil syna
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Child info */}
          <div>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Profil dítěte a školy</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Jméno syna</label>
                <input
                  type="text"
                  required
                  value={form.child.name}
                  onChange={(e) =>
                    setForm({ ...form, child: { ...form.child, name: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Třída</label>
                <input
                  type="text"
                  placeholder="Např. 4. B"
                  value={form.child.grade}
                  onChange={(e) =>
                    setForm({ ...form, child: { ...form.child, grade: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Název školy / jídelny</label>
                <input
                  type="text"
                  placeholder="Např. ZŠ Komenského"
                  value={form.child.schoolName}
                  onChange={(e) =>
                    setForm({ ...form, child: { ...form.child, schoolName: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Variabilní symbol</label>
                <input
                  type="text"
                  placeholder="Např. 4208"
                  value={form.child.symbol}
                  onChange={(e) =>
                    setForm({ ...form, child: { ...form.child, symbol: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial pricing */}
          <div className="pt-4 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Ceny a trvalý příkaz</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Cena za 1 oběd (Kč)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.pricePerLunch}
                  onChange={(e) =>
                    setForm({ ...form, pricePerLunch: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-mono"
                />
                <span className="text-[11px] text-stone-500">Běžná cena za den stravování</span>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Měsíční trvalý příkaz (Kč)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.monthlyPayment}
                  onChange={(e) =>
                    setForm({ ...form, monthlyPayment: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-mono"
                />
                <span className="text-[11px] text-stone-500">Částka, kterou posíláte z banky</span>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Počáteční přeplatek z loňska (Kč)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.initialBalance}
                  onChange={(e) =>
                    setForm({ ...form, initialBalance: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white font-mono"
                />
                <span className="text-[11px] text-stone-500">Převedeno ze září / minulého roku</span>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Školní rok
                </label>
                <input
                  type="text"
                  value={form.schoolYear}
                  onChange={(e) =>
                    setForm({ ...form, schoolYear: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                />
                <span className="text-[11px] text-stone-500">Např. 2026/2027</span>
              </div>
            </div>
          </div>

          {/* Section 3: Data Management & Backup */}
          <div className="pt-4 border-t border-stone-200 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Záloha a ochrana dat
              </h4>
              <p className="text-xs text-stone-500">
                Při smazání aplikace z plochy mobilu může systém vymazat lokální paměť. Zde si můžete data pojistit:
              </p>
            </div>

            {/* Cloud Backup Highlight Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              familyInfo
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-amber-50/80 border-amber-300'
            }`}>
              <div className="flex items-start gap-2.5">
                {familyInfo ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Cloud className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{familyInfo ? 'Cloudová záloha je AKTIVNÍ' : 'Cloudová záloha (doporučeno)'}</span>
                    {familyInfo && <span className="font-mono bg-emerald-200/60 px-1.5 py-0.2 rounded text-[11px] text-emerald-900">{familyInfo.code}</span>}
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {familyInfo
                      ? 'Vaše data jsou v bezpečí na serveru. I při smazání aplikace stačí zadat kód a vše se obnoví.'
                      : 'Chrání před smazáním aplikace a umožňuje snadné obnovení nebo sdílení s druhým rodičem.'}
                  </p>
                </div>
              </div>

              {onOpenFamilyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFamilyModal();
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    familyInfo
                      ? 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-2xs'
                      : 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                  }`}
                >
                  <span>{familyInfo ? 'Zobrazit kód zálohy' : 'Aktivovat zálohu v cloudu'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Local File Backup (JSON) */}
            <div>
              <div className="text-xs font-semibold text-stone-700 mb-2">
                Ruční záloha do souboru (JSON):
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold"
                  title="Stáhne soubor se všemi obědy a platbami do vašeho zařízení"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Stáhnout zálohu (JSON)</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer" title="Nahraje data z dříve staženého souboru JSON">
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Obnovit ze souboru JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Chcete obnovit ukázková data pro září a říjen?')) {
                      onResetDemoData();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-900 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nahrát vzorová data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Opravdu chcete vymazat všechny záznamy a začít s čistým stolem?')) {
                      onClearAllData();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vymazat vše</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form action buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-2xs"
            >
              {successSaved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{successSaved ? 'Uloženo!' : 'Uložit nastavení'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
