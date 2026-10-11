import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running standalone, hide the prompt
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-colors"
        title="Uložit Obědník jako aplikaci na plochu telefonu"
      >
        <img
          src="/apple-touch-icon.png"
          alt="Ikona obědu"
          className="w-4 h-4 rounded-md shadow-2xs"
        />
        <span className="hidden sm:inline">Přidat na plochu</span>
        <span className="sm:hidden">Na plochu</span>
      </button>

      {/* Guide Modal for iOS Safari / Android browsers */}
      {showGuide && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-stone-200 text-center">
            {/* Lunch Icon Preview */}
            <div className="relative inline-block mb-3">
              <img
                src="/apple-touch-icon.png"
                alt="Ikona obědu na ploše"
                className="w-20 h-20 rounded-2xl shadow-md border border-amber-200 mx-auto"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Uložit Obědník na plochu telefonu
            </h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Aplikace se vám uloží přímo mezi vaše aplikace s touto ikonou obědu.
            </p>

            {isIOS ? (
              /* iOS Safari instructions */
              <div className="text-left bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-2.5 text-stone-700">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    Dole v prohlížeči Safari klikněte na tlačítko <strong>Sdílet</strong> (čtvereček se šipkou nahoru).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    Sjeďte v nabídce o kousek níže a zvolte <strong>Přidat na plochu</strong> (Add to Home Screen).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    Klikněte vpravo nahoře na <strong>Přidat</strong>. Hotovo!
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chrome instructions */
              <div className="text-left bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-2.5 text-stone-700">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    V pravém horním rohu prohlížeče Chrome klikněte na <strong>tři tečky ⋮</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    Vyberte možnost <strong>Nainstalovat aplikaci</strong> nebo <strong>Přidat na plochu</strong>.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 px-4 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
            >
              Rozumím / Zavřít
            </button>
          </div>
        </div>
      )}
    </>
  );
};
