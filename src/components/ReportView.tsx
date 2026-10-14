import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Printer,
  Download,
  Calendar,
  User,
  School,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hash,
  FileDown,
  Loader2,
  Check,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  AppSettings,
  LunchRecord,
  MonthlyPaymentRecord,
  OverallSettlement,
} from '../types/lunch';
import {
  getSchoolMonths,
  getMonthDays,
  formatCzechDateLong,
  formatCzk,
} from '../utils/czechCalendar';
import { computeMonthSummary } from '../utils/storage';

interface ReportViewProps {
  settings: AppSettings;
  settlement: OverallSettlement;
  records: Record<string, LunchRecord>;
  payments: Record<string, MonthlyPaymentRecord>;
  todayIso: string;
}

export const ReportView: React.FC<ReportViewProps> = ({
  settings,
  settlement,
  records,
  payments,
  todayIso,
}) => {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);

  // Direct PDF generation and download via html2canvas & jsPDF
  const handleSavePdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    setStatusMessage({
      type: 'info',
      text: 'Generuji PDF soubor... Může to trvat několik sekund.',
    });

    try {
      const reportEl = reportRef.current;

      // Capture element with html2canvas formatted specifically for A4 document width
      const canvas = await html2canvas(reportEl, {
        scale: 2, // 2x resolution for razor-sharp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const clonedReport = clonedDoc.getElementById('printable-report-content');
          if (clonedReport) {
            clonedReport.style.width = '800px';
            clonedReport.style.maxWidth = '800px';
            clonedReport.style.margin = '0 auto';
            clonedReport.style.padding = '32px';
            clonedReport.style.boxShadow = 'none';
            clonedReport.style.border = 'none';
            clonedReport.style.backgroundColor = '#ffffff';

            // Make sure signature box is visible in cloned PDF render
            const signatures = clonedDoc.getElementById('report-signatures');
            if (signatures) {
              signatures.style.display = 'grid';
            }

            // Hide UI controls that shouldn't appear in document
            const hiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
            hiddenElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });

            // Prevent horizontal clipping of tables
            const overflowContainers = clonedDoc.querySelectorAll('.overflow-x-auto');
            overflowContainers.forEach((c) => {
              (c as HTMLElement).style.overflow = 'visible';
            });
          }
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pageHeightInPx = Math.floor(canvasWidth * (pdfHeight / pdfWidth));

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvasHeight) {
        const sourceY = renderedHeight;
        const sourceHeight = Math.min(pageHeightInPx, canvasHeight - sourceY);

        // Create canvas slice for this specific page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = pageHeightInPx;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvasWidth,
            sourceHeight,
            0,
            0,
            canvasWidth,
            sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        renderedHeight += sourceHeight;
        pageIndex++;
      }

      const cleanChildName = (settings.child.name || 'zak')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/gi, '_');
      const cleanYear = (settings.schoolYear || '2026-2027').replace(/[^0-9-]/g, '-');
      const fileName = `vyuctovani_obedu_${cleanChildName}_${cleanYear}.pdf`;

      pdf.save(fileName);

      setStatusMessage({
        type: 'success',
        text: `PDF soubor „${fileName}“ byl úspěšně vygenerován a stažen do vašeho zařízení!`,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      setStatusMessage({
        type: 'error',
        text: 'Generování PDF selhalo. Zkuste to prosím znovu nebo použijte Export do CSV.',
      });
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => {
        setStatusMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 7000);
    }
  };

  const handlePrint = async () => {
    // Check if we are inside an iframe where window.print is usually blocked
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      // In sandbox/iframe window.print() throws SecurityError or silently fails
      try {
        window.print();
      } catch (err) {
        console.warn('Direct print blocked by browser sandbox:', err);
        setStatusMessage({
          type: 'info',
          text: 'Přímý tisk z okna byl zablokován zabezpečením prohlížeče. Generuji pro vás PDF ke stažení...',
        });
        await handleSavePdf();
        return;
      }
    } else {
      try {
        window.print();
      } catch (err) {
        console.warn('Window print failed, falling back to PDF generation:', err);
        await handleSavePdf();
      }
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Datum', 'Den v týdnu', 'Stav oběda', 'Cena (Kč)', 'Poznámka'].join(';'),
    ];

    schoolMonths.forEach((m) => {
      const days = getMonthDays(m.year, m.monthIndex);
      days.forEach((day) => {
        if (day.isWeekend) return;
        const rec = records[day.dateStr];
        let statusLabel = 'Nezadáno';
        let cost = 0;

        if (day.isHoliday) {
          statusLabel = day.holidayName || 'Prázdniny/Svátek';
        } else if (rec?.status === 'eaten') {
          statusLabel = 'Byl na obědě (odebráno)';
          cost = settings.pricePerLunch;
        } else if (rec?.status === 'canceled') {
          statusLabel = 'Odhlášeno (nemoc/omluva)';
          cost = 0;
        } else if (rec?.status === 'missed') {
          statusLabel = 'Neodhlášeno (propadl)';
          cost = settings.pricePerLunch;
        }

        const dayName = [
          'Neděle',
          'Pondělí',
          'Úterý',
          'Středa',
          'Čtvrtek',
          'Pátek',
          'Sobota',
        ][day.dayOfWeek];
        const note = rec?.note || '';

        rows.push([day.dateStr, dayName, `"${statusLabel}"`, cost, `"${note}"`].join(';'));
      });
    });

    const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for Czech Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `vyuctovani_obedu_${settings.child.name.toLowerCase()}_${settings.schoolYear.replace('/', '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMonthLabel =
    selectedMonthFilter === 'all'
      ? 'Celý školní rok'
      : schoolMonths.find((m) => m.key === selectedMonthFilter)?.label || '';

  return (
    <div className="space-y-6">
      {/* Control Actions Bar (Hidden in Print) */}
      <div className="print:hidden bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>Tiskový podklad pro školní jídelnu</span>
          </h2>
          <p className="text-xs text-stone-500">
            Kompletní soupis pro kontrolu a vyúčtování na konci školního roku.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Primary Action: Direct PDF Download */}
          <button
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-xs font-bold transition-all shadow-sm"
            title="Vygenerovat a stáhnout oficiální PDF vyúčtování"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generuji PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Uložit / Stáhnout PDF</span>
              </>
            )}
          </button>

          {/* 2. Print action */}
          <button
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition-colors shadow-2xs"
            title="Otevřít tiskový dialog"
          >
            <Printer className="w-4 h-4" />
            <span>Vytisknout</span>
          </button>

          {/* 3. CSV export for Excel */}
          <button
            onClick={handleExportCsv}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 text-xs font-semibold transition-colors shadow-2xs"
            title="Exportovat do tabulkového procesoru Excel"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Exportovat CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Toast/Banner */}
      {statusMessage && (
        <div
          className={`print:hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {statusMessage.type === 'error' && (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {statusMessage.type === 'info' && (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>

          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 text-xs underline shrink-0"
          >
            Zavřít
          </button>
        </div>
      )}

      {/* Printable Sheet */}
      <div
        ref={reportRef}
        id="printable-report-content"
        className="bg-white border border-stone-200 print:border-0 rounded-2xl p-6 sm:p-8 shadow-xs print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="border-b-2 border-stone-900 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-stone-500">
                PŘEHLED STRAVOVÁNÍ A PLATEB
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-0.5">
                Vyúčtování školních obědů {settings.schoolYear}
              </h1>
            </div>

            <div className="text-right text-xs text-stone-500 font-mono">
              <div>Vygenerováno: {new Date().toLocaleDateString('cs-CZ')}</div>
              <div className="text-[11px] text-stone-400">Aplikace Obědník</div>
            </div>
          </div>

          {/* Child & School details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
            <div>
              <span className="text-stone-400 uppercase font-semibold">Žák</span>
              <div className="font-bold text-stone-900 text-sm">{settings.child.name}</div>
            </div>

            <div>
              <span className="text-stone-400 uppercase font-semibold">Třída & Škola</span>
              <div className="font-bold text-stone-900 text-sm">
                {settings.child.grade || '—'} · {settings.child.schoolName || 'Základní škola'}
              </div>
            </div>

            <div>
              <span className="text-stone-400 uppercase font-semibold">Variabilní symbol</span>
              <div className="font-bold font-mono text-stone-900 text-sm">
                {settings.child.symbol || 'Neuveden'}
              </div>
            </div>

            <div>
              <span className="text-stone-400 uppercase font-semibold">Cena oběda</span>
              <div className="font-bold font-mono text-stone-900 text-sm">
                {formatCzk(settings.pricePerLunch)} / oběd
              </div>
            </div>
          </div>
        </div>

        {/* Big Totals Box on Paper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl mb-6 text-xs sm:text-sm">
          <div>
            <div className="text-stone-500 font-medium">Celkem odebráno:</div>
            <div className="text-lg font-bold text-emerald-700">
              {settlement.eatenCount} obědů
            </div>
            <div className="text-[11px] text-stone-400 font-mono">
              ({formatCzk(settlement.eatenCount * settings.pricePerLunch)})
            </div>
          </div>

          <div>
            <div className="text-stone-500 font-medium">Včas odhlášeno:</div>
            <div className="text-lg font-bold text-sky-700">
              {settlement.canceledCount} obědů
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold font-mono">
              ušetřeno {formatCzk(settlement.totalSavedByCancelation)}
            </div>
          </div>

          <div>
            <div className="text-stone-500 font-medium">Zaplaceno na zálohách:</div>
            <div className="text-lg font-bold font-mono text-stone-900">
              {formatCzk(settlement.totalPaidSoFar)}
            </div>
            <div className="text-[11px] text-stone-400">
              trvalé příkazy + vklady
            </div>
          </div>

          <div>
            <div className="text-stone-500 font-medium">Aktuální vyúčtování:</div>
            <div
              className={`text-lg font-bold font-mono ${
                settlement.currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {settlement.currentBalance >= 0 ? '+' : ''}
              {formatCzk(settlement.currentBalance)}
            </div>
            <div className="text-[11px] font-semibold text-stone-600">
              {settlement.currentBalance >= 0 ? 'Přeplatek k vrácení' : 'Nedoplatek k úhradě'}
            </div>
          </div>
        </div>

        {/* Monthly Summary Table */}
        <div className="mb-6">
          <h3 className="font-bold text-stone-900 text-sm mb-2 uppercase tracking-wider">
            1. Souhrn po jednotlivých měsících
          </h3>
          <table className="w-full text-left text-xs border border-stone-200">
            <thead className="bg-stone-100 border-b border-stone-200 font-bold text-stone-700">
              <tr>
                <th className="p-2">Měsíc</th>
                <th className="p-2 text-right">Školní dny</th>
                <th className="p-2 text-right">Odebráno</th>
                <th className="p-2 text-right">Odhlášeno</th>
                <th className="p-2 text-right">Propadlo</th>
                <th className="p-2 text-right">Cena obědů</th>
                <th className="p-2 text-right">Záloha</th>
                <th className="p-2 text-right">Zůstatek měsíce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {schoolMonths.map((m) => {
                const pay = payments[m.key];
                const sum = computeMonthSummary(m.year, m.monthIndex, settings, records, pay, todayIso);
                const isPaid = pay?.paid ?? false;
                const paidAmt = isPaid ? (pay?.actualAmount ?? pay?.plannedAmount ?? settings.monthlyPayment) : 0;
                const diff = paidAmt - sum.totalCost;

                return (
                  <tr key={m.key} className="even:bg-stone-50/50">
                    <td className="p-2 font-semibold text-stone-900">{m.label}</td>
                    <td className="p-2 text-right text-stone-600">{sum.totalSchoolDays}</td>
                    <td className="p-2 text-right font-medium text-emerald-700">{sum.eatenCount}</td>
                    <td className="p-2 text-right font-medium text-sky-700">{sum.canceledCount}</td>
                    <td className="p-2 text-right text-amber-700">{sum.missedCount}</td>
                    <td className="p-2 text-right font-mono font-medium">{formatCzk(sum.totalCost)}</td>
                    <td className="p-2 text-right font-mono">
                      {isPaid ? formatCzk(paidAmt) : '0 Kč'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      {isPaid ? (
                        <span className={diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {diff >= 0 ? '+' : ''}
                          {formatCzk(diff)}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Filter Month selector for detailed daily log (print:hidden) */}
        <div className="print:hidden flex items-center justify-between mb-3 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              2. Detailní soupis odhlášek a docházky po dnech
            </h3>
            <span className="text-xs text-stone-500 font-medium">({selectedMonthLabel})</span>
          </div>

          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
          >
            <option value="all">Všechny měsíce (celý školní rok)</option>
            {schoolMonths.map((m) => (
              <option key={m.key} value={m.key}>
                Pouze {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Detailed Days Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-200">
            <thead className="bg-stone-100 border-b border-stone-200 font-bold text-stone-700">
              <tr>
                <th className="p-2">Datum</th>
                <th className="p-2">Stav oběda</th>
                <th className="p-2 text-right">Účtováno</th>
                <th className="p-2">Poznámka / Důvod omluvy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {schoolMonths
                .filter((m) => selectedMonthFilter === 'all' || m.key === selectedMonthFilter)
                .flatMap((m) => getMonthDays(m.year, m.monthIndex))
                .filter((day) => !day.isWeekend)
                .map((day) => {
                  const rec = records[day.dateStr];
                  const isEaten = rec?.status === 'eaten';
                  const isCanceled = rec?.status === 'canceled';
                  const isMissed = rec?.status === 'missed';

                  return (
                    <tr
                      key={day.dateStr}
                      className={
                        isCanceled
                          ? 'bg-sky-50/40'
                          : day.isHoliday
                          ? 'bg-amber-50/20'
                          : 'even:bg-stone-50/50'
                      }
                    >
                      <td className="p-2 font-mono text-stone-700">
                        {formatCzechDateLong(day.dateStr)}
                      </td>
                      <td className="p-2">
                        {day.isHoliday ? (
                          <span className="text-stone-500 font-medium">
                            🏖️ {day.holidayName || 'Prázdniny / Svátek'}
                          </span>
                        ) : isEaten ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Byl na obědě (odebráno)
                          </span>
                        ) : isCanceled ? (
                          <span className="text-sky-800 font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Odhlášeno včas
                          </span>
                        ) : isMissed ? (
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Neodhlášeno (propadl)
                          </span>
                        ) : (
                          <span className="text-stone-400">Nezadáno</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono font-medium">
                        {isEaten || isMissed
                          ? formatCzk(settings.pricePerLunch)
                          : '0 Kč'}
                      </td>
                      <td className="p-2 text-stone-600 italic">
                        {rec?.note || '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Signature lines for paper print / PDF */}
        <div
          id="report-signatures"
          className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-stone-300 text-xs"
        >
          <div>
            <div className="border-b border-stone-400 pb-8 mb-2"></div>
            <div className="text-stone-600">Podpis zákonného zástupce</div>
          </div>
          <div>
            <div className="border-b border-stone-400 pb-8 mb-2"></div>
            <div className="text-stone-600">Podpis vedoucí školní jídelny</div>
          </div>
        </div>
      </div>
    </div>
  );
};
