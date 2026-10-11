import React, { useState } from 'react';
import {
  X,
  Users,
  Smartphone,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Link,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { FamilyInfo, setStoredUserRole } from '../services/familySync';
import { AppSettings } from '../types/lunch';

interface FamilySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyInfo: FamilyInfo | null;
  userRole: string;
  setUserRole: (role: string) => void;
  settings: AppSettings;
  onCreateFamily: (name: string) => Promise<void>;
  onJoinFamily: (code: string) => Promise<boolean>;
  onLeaveFamily: () => void;
}

export const FamilySyncModal: React.FC<FamilySyncModalProps> = ({
  isOpen,
  onClose,
  familyInfo,
  userRole,
  setUserRole,
  settings,
  onCreateFamily,
  onJoinFamily,
  onLeaveFamily,
}) => {
  if (!isOpen) return null;

  const [familyNameInput, setFamilyNameInput] = useState(
    `Rodina (${settings.child.name})`
  );
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Generate shareable invite link with current URL and family code
  const currentBaseUrl = window.location.origin + window.location.pathname;
  const inviteLink = familyInfo
    ? `${currentBaseUrl}?family=${familyInfo.code}`
    : '';

  const handleCreate = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await onCreateFamily(familyNameInput);
    } catch (e: any) {
      setErrorMsg('Nepodařilo se vytvořit rodinnou skupinu. Zkuste to znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const ok = await onJoinFamily(joinCodeInput.trim());
      if (!ok) {
        setErrorMsg('Kód rodiny nebyl nalezen. Zkontrolujte prosím zadání.');
      } else {
        setJoinCodeInput('');
      }
    } catch (e: any) {
      setErrorMsg('Chyba při připojování k rodině.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!familyInfo) return;
    navigator.clipboard.writeText(familyInfo.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSelectRole = (role: string) => {
    setUserRole(role);
    setStoredUserRole(role);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Rodinné sdílení v reálném čase
              </h3>
              <p className="text-xs text-stone-500">
                Synchronizace obědů mezi telefony rodičů
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {familyInfo ? (
            /* ACTIVE FAMILY SHARING STATE */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <span>Rodinná synchronizace je aktivní</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Skupina: <strong>{familyInfo.name}</strong>. Každá změna na vašem telefonu se
                    okamžitě projeví i u manželky a naopak.
                  </p>
                </div>
              </div>

              {/* Family Code Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                <span className="text-xs uppercase font-bold text-stone-500 tracking-wider">
                  Kód pro připojení druhého telefonu
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-stone-900 my-1">
                  {familyInfo.code}
                </div>
                <p className="text-[11px] text-stone-500 mb-3">
                  Tento kód stačí zadat na druhém telefonu v této obrazovce.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 hover:bg-stone-100 shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                    <span>{copiedCode ? 'Kód zkopírován!' : 'Kopírovat kód'}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 shadow-2xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Odkaz zkopírován!' : 'Kopírovat odkaz pro manželku'}</span>
                  </button>

                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 shadow-2xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-stone-600" />
                    <span>{showQr ? 'Skrýt QR kód' : 'Zobrazit QR kód'}</span>
                  </button>
                </div>

                {/* QR Code display */}
                {showQr && (
                  <div className="mt-4 p-4 bg-white border border-stone-200 rounded-xl inline-block shadow-2xs">
                    <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-2 bg-stone-50">
                      <QrCode className="w-24 h-24 text-stone-800 mb-2" />
                      <div className="text-[11px] font-mono font-bold text-stone-900">{familyInfo.code}</div>
                      <div className="text-[10px] text-stone-500 text-center">
                        Otevřete fotoaparát na mobilu manželky
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-2">
                      Nebo pošlete přímý odkaz: <br />
                      <span className="font-mono text-stone-700 break-all text-[10px]">
                        {inviteLink}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Who is recording selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
                  Na tomto telefonu zapisuji jako:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Táta', 'Máma', 'Rodič'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSelectRole(r)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                        userRole === r
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leave family button */}
              <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                <span className="text-stone-400">Chcete se odpojit?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Opravdu se chcete odpojit od rodinné synchronizace? Vaše data zůstanou v cloudu i v tomto telefonu.')) {
                      onLeaveFamily();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Odpojit tento telefon</span>
                </button>
              </div>
            </div>
          ) : (
            /* NO FAMILY YET - OPTIONS TO CREATE OR JOIN */
            <div className="space-y-6">
              {/* Option 1: Create Family */}
              <div className="p-4 sm:p-5 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-stone-900 text-sm">
                    1. Jsem první z rodičů – chci vytvořit rodinu
                  </h4>
                </div>
                <p className="text-xs text-stone-600 mb-4">
                  Nahrajete dosud zadaná data do cloudu a získáte kód a odkaz pro manželku.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Název rodinné skupiny
                    </label>
                    <input
                      type="text"
                      value={familyNameInput}
                      onChange={(e) => setFamilyNameInput(e.target.value)}
                      placeholder="Např. Rodina Vrabec"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Vytvořit rodinné sdílení</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: Join Existing Family */}
              <div className="p-4 sm:p-5 bg-white border border-stone-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-stone-700" />
                  <h4 className="font-bold text-stone-900 text-sm">
                    2. Manžel/manželka už rodinu vytvořil(a) – chci se připojit
                  </h4>
                </div>
                <p className="text-xs text-stone-600 mb-4">
                  Zadejte 8místný kód rodiny (např. <code>OBED-4821</code>), který vám druhý rodič ukázal.
                </p>

                <form onSubmit={handleJoin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Kód rodiny
                    </label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="OBED-XXXX"
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-300 bg-white uppercase tracking-wider text-center text-sm font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !joinCodeInput.trim()}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-40"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Připojit se k rodině</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800"
          >
            Hotovo / Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
