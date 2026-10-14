import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LIBERATION_SANS_REGULAR, LIBERATION_SANS_BOLD } from './pdfFonts';
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
} from './czechCalendar';
import { computeMonthSummary } from './storage';

export interface GeneratePdfOptions {
  settings: AppSettings;
  settlement: OverallSettlement;
  records: Record<string, LunchRecord>;
  payments: Record<string, MonthlyPaymentRecord>;
  monthFilter?: string; // 'all' or monthKey like '2026-10'
  todayIso?: string;
}

const CZECH_DAY_NAMES = [
  'Neděle',
  'Pondělí',
  'Úterý',
  'Středa',
  'Čtvrtek',
  'Pátek',
  'Sobota',
];

/**
 * Builds a vector PDF document using jsPDF & autoTable with embedded LiberationSans font.
 * 100% resilient on mobile iOS/Android, doesn't depend on DOM canvas or CSS parsing.
 */
export function buildLunchPdfDocument({
  settings,
  settlement,
  records,
  payments,
  monthFilter = 'all',
  todayIso = new Date().toISOString().split('T')[0],
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Register LiberationSans fonts for complete Czech diacritics
  doc.addFileToVFS('LiberationSans-Regular.ttf', LIBERATION_SANS_REGULAR);
  doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');
  doc.addFileToVFS('LiberationSans-Bold.ttf', LIBERATION_SANS_BOLD);
  doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');

  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);
  const generatedDateStr = formatCzechDateLong(todayIso);

  const activeMonthName =
    monthFilter === 'all'
      ? 'Celý školní rok'
      : schoolMonths.find((m) => m.key === monthFilter)?.label || monthFilter;

  // Header banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 26, 'F');

  // Amber accent line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 26, 210, 2, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(15);
  doc.text('PŘEHLED A VYÚČTOVÁNÍ ŠKOLNÍCH OBĚDŮ', 14, 12);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Školní rok: ${settings.schoolYear || '2026/2027'}  |  Období: ${activeMonthName}  |  Vystaveno: ${generatedDateStr}`,
    14,
    19
  );

  let currentY = 35;

  // Student and School Information Cards (2 columns)
  const leftX = 14;
  const colWidth = 87;
  const rightX = 109;
  const boxHeight = 32;

  // Left box: Student info
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftX, currentY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Údaje o strávníkovi (žák)', leftX + 4, currentY + 6);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const studentName = settings.child.name || 'Neuvedeno';
  const studentGrade = settings.child.grade ? ` (${settings.child.grade})` : '';

  doc.text(`Jméno: ${studentName}${studentGrade}`, leftX + 4, currentY + 13);
  doc.text(
    `Škola: ${settings.child.schoolName || 'Základní škola'}`,
    leftX + 4,
    currentY + 19
  );
  doc.text(
    `Nastavená měsíční platba: ${formatCzk(settings.monthlyPayment)} / měsíc`,
    leftX + 4,
    currentY + 25
  );

  // Right box: Canteen & Payment info
  doc.roundedRect(rightX, currentY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Platba a jídelna', rightX + 4, currentY + 6);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Číslo účtu jídelny: ${settings.child.canteenAccount || 'Neuvedeno'}`, rightX + 4, currentY + 13);
  doc.text(`Variabilní symbol: ${settings.child.symbol || 'Neuvedeno'}`, rightX + 4, currentY + 19);
  doc.text(`Cena za 1 oběd: ${formatCzk(settings.pricePerLunch)}`, rightX + 4, currentY + 25);

  currentY += boxHeight + 6;

  // Financial Summary Banner
  const isOverpaid = settlement.currentBalance > 0;
  const isDebt = settlement.currentBalance < 0;

  let balanceBoxBg: [number, number, number] = [240, 253, 244]; // green-50
  let balanceBoxBorder: [number, number, number] = [187, 247, 208]; // green-200
  let balanceTextColor: [number, number, number] = [22, 101, 52]; // green-800
  let balanceLabel = `PŘEPLATEK: +${formatCzk(settlement.currentBalance)} (k vrácení / převodu)`;

  if (isDebt) {
    balanceBoxBg = [254, 242, 242]; // red-50
    balanceBoxBorder = [254, 202, 202]; // red-200
    balanceTextColor = [153, 27, 27]; // red-800
    balanceLabel = `NEDOPLATEK: ${formatCzk(Math.abs(settlement.currentBalance))} (doporučeno doplatit)`;
  } else if (settlement.currentBalance === 0) {
    balanceBoxBg = [241, 245, 249];
    balanceBoxBorder = [203, 213, 225];
    balanceTextColor = [51, 65, 85];
    balanceLabel = 'VYROVNÁNO (0 Kč)';
  }

  doc.setFillColor(...balanceBoxBg);
  doc.setDrawColor(...balanceBoxBorder);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...balanceTextColor);
  doc.text(`STAV K DNEŠNÍMU DNI:  ${balanceLabel}`, 18, currentY + 7);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Zaplaceno zálohami: ${formatCzk(settlement.totalPaidSoFar)}  |  Skutečná cena obědů: ${formatCzk(
      settlement.totalSpentOnLunches
    )}  |  Odebráno: ${settlement.eatenCount}×  |  Odhlášeno: ${settlement.canceledCount}×  |  Propadlo: ${
      settlement.missedCount
    }×`,
    18,
    currentY + 12
  );

  currentY += 21;

  // Monthly summary table
  const filteredMonths =
    monthFilter === 'all'
      ? schoolMonths
      : schoolMonths.filter((m) => m.key === monthFilter);

  const monthlyRows = filteredMonths.map((m) => {
    const sum = computeMonthSummary(
      m.year,
      m.monthIndex,
      settings,
      records,
      payments[m.key],
      todayIso
    );
    const balanceDiff = sum.difference;
    const balanceStr =
      balanceDiff > 0
        ? `+${formatCzk(balanceDiff)}`
        : balanceDiff < 0
        ? `-${formatCzk(Math.abs(balanceDiff))}`
        : '0 Kč';

    return [
      m.label,
      formatCzk(sum.paidAmount),
      `${sum.eatenCount}×`,
      `${sum.canceledCount}×`,
      `${sum.missedCount}×`,
      formatCzk(sum.totalCost),
      balanceStr,
    ];
  });

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Měsíční přehled', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    head: [
      [
        'Měsíc',
        'Záloha',
        'Odebráno',
        'Odhlášeno',
        'Propadlo',
        'Skutečné náklady',
        'Měsíční bilance',
      ],
    ],
    body: monthlyRows,
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      font: 'LiberationSans',
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      font: 'LiberationSans',
      fontStyle: 'bold',
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
  });

  // Get position after first table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTable = (doc as any).lastAutoTable;
  currentY = (lastTable ? lastTable.finalY : currentY) + 8;

  // Day-by-day table
  const dayRows: string[][] = [];

  filteredMonths.forEach((m) => {
    const days = getMonthDays(m.year, m.monthIndex);
    days.forEach((day) => {
      if (day.isWeekend) return;
      const rec = records[day.dateStr];
      let statusText = 'Nezadáno';
      let costText = '–';
      let noteText = '';

      if (day.isHoliday) {
        statusText = day.holidayName || 'Prázdniny/Svátek';
        costText = '0 Kč';
      } else if (rec?.status === 'eaten') {
        statusText = 'Odebráno (byl na obědě)';
        costText = formatCzk(settings.pricePerLunch);
        noteText = rec.note || '';
      } else if (rec?.status === 'canceled') {
        statusText = 'Odhlášeno (nemoc/omluva)';
        costText = '0 Kč';
        noteText = rec.note || 'Omluveno';
      } else if (rec?.status === 'missed') {
        statusText = 'Neodhlášeno (propadl)';
        costText = formatCzk(settings.pricePerLunch);
        noteText = rec.note || 'Propadlý oběd';
      }

      const dayName = CZECH_DAY_NAMES[day.dayOfWeek] || '';

      dayRows.push([
        day.dateStr.split('-').reverse().join('.'), // DD.MM.YYYY
        dayName,
        statusText,
        costText,
        noteText,
      ]);
    });
  });

  if (dayRows.length > 0) {
    // If not enough room for header + at least 3 rows on current page, add new page
    if (currentY > 240) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Detailní denní rozpis (${monthFilter === 'all' ? 'Všechny školní dny' : activeMonthName})`,
      14,
      currentY
    );
    currentY += 3;

    autoTable(doc, {
      head: [['Datum', 'Den v týdnu', 'Stav oběda', 'Cena', 'Poznámka']],
      body: dayRows,
      startY: currentY,
      margin: { left: 14, right: 14, bottom: 20 },
      theme: 'striped',
      styles: {
        font: 'LiberationSans',
        fontStyle: 'normal',
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 41, 59],
      },
      headStyles: {
        font: 'LiberationSans',
        fontStyle: 'bold',
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 28 },
        2: { cellWidth: 48 },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 59 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = String(data.cell.raw);
          if (val.includes('Odebráno')) {
            data.cell.styles.textColor = [22, 101, 52];
          } else if (val.includes('Odhlášeno')) {
            data.cell.styles.textColor = [180, 83, 9];
          } else if (val.includes('Neodhlášeno')) {
            data.cell.styles.textColor = [185, 28, 28];
          }
        }
      },
    });
  }

  // Add Signatures on the final page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endTable = (doc as any).lastAutoTable;
  let signY = (endTable ? endTable.finalY : currentY) + 12;

  // If signatures would overflow page (page height is 297mm, margin 20mm), add page
  if (signY > 255) {
    doc.addPage();
    signY = 25;
  }

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  // Signatures lines
  const sigCol1 = 20;
  const sigCol2 = 85;
  const sigCol3 = 150;

  doc.line(sigCol1, signY + 12, sigCol1 + 45, signY + 12);
  doc.text('Podpis zákonného zástupce', sigCol1, signY + 16);

  doc.line(sigCol2, signY + 12, sigCol2 + 45, signY + 12);
  doc.text('Podpis vedoucí stravování', sigCol2, signY + 16);

  doc.line(sigCol3, signY + 12, sigCol3 + 45, signY + 12);
  doc.text('Datum a razítko jídelny', sigCol3, signY + 16);

  // Add page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('LiberationSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Obědník – Systém evidence školních obědů  •  Generováno: ${generatedDateStr}`,
      14,
      290
    );
    doc.text(`Strana ${i} z ${totalPages}`, 196, 290, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads or shares the generated PDF.
 * On modern mobile (iOS / Android), uses navigator.share with File so the user can easily
 * tap "Uložit do Souborů" (Save to Files), print, AirDrop, or send via WhatsApp/Mail.
 * On desktop or when sharing is unsupported, triggers a direct download.
 */
export async function downloadOrSharePdf(
  doc: jsPDF,
  fileName: string,
  childName?: string
): Promise<{ method: 'share' | 'download' | 'preview'; success: boolean }> {
  const blob = doc.output('blob');

  // Try Web Share API (native iOS / Android share dialog)
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: 'Vyúčtování školních obědů',
        text: `Vyúčtování a podklad pro jídelnu (${childName || 'žák'}).`,
      });
      return { method: 'share', success: true };
    }
  } catch (err) {
    // If user cancelled the share dialog (AbortError), that's not an error
    if (err instanceof Error && err.name === 'AbortError') {
      return { method: 'share', success: true };
    }
    console.warn('Native share failed, falling back to download:', err);
  }

  // Fallback to standard download
  try {
    doc.save(fileName);
    return { method: 'download', success: true };
  } catch (saveErr) {
    console.warn('doc.save failed, trying blob URL fallback:', saveErr);

    // Secondary fallback: manual blob link
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 4000);

    return { method: 'download', success: true };
  }
}

/**
 * Opens PDF in a new browser tab/window for direct viewing or printing
 */
export function openPdfInNewTab(doc: jsPDF): void {
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
}
