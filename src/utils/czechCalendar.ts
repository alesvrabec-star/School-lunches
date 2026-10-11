import { DayInfo } from '../types/lunch';

// Compute Easter Sunday (Gauss algorithm)
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

export function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatCzechDateLong(isoStr: string): string {
  const d = parseIsoDate(isoStr);
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const months = [
    'ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'
  ];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
}

export function formatCzechMonthYear(year: number, monthIndex: number): string {
  const months = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  return `${months[monthIndex]} ${year}`;
}

// Return official Czech public holiday or common school holiday name if any
export function getCzechHoliday(date: Date): string | null {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const year = date.getFullYear();

  // Fixed public holidays
  if (month === 0 && day === 1) return 'Nový rok / Den obnovy samostatnosti';
  if (month === 4 && day === 1) return 'Svátek práce';
  if (month === 4 && day === 8) return 'Den vítězství';
  if (month === 6 && day === 5) return 'Den věrozvěstů Cyrila a Metoděje';
  if (month === 6 && day === 6) return 'Den upálení mistra Jana Husa';
  if (month === 8 && day === 28) return 'Den české státnosti (sv. Václav)';
  if (month === 9 && day === 28) return 'Den vzniku samostatného Československa';
  if (month === 10 && day === 17) return 'Den boje za svobodu a demokracii';
  if (month === 11 && day === 24) return 'Štědrý den';
  if (month === 11 && day === 25) return '1. svátek vánoční';
  if (month === 11 && day === 26) return '2. svátek vánoční';

  // Movable Easter
  const easter = getEasterSunday(year);
  // Good Friday = Easter - 2 days
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  if (month === goodFriday.getMonth() && day === goodFriday.getDate()) {
    return 'Velký pátek';
  }
  // Easter Monday = Easter + 1 day
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  if (month === easterMonday.getMonth() && day === easterMonday.getDate()) {
    return 'Velikonoční pondělí';
  }

  // Common school Christmas vacation (23.12. - 2.1.)
  if (month === 11 && day >= 23) {
    return 'Vánoční prázdniny';
  }
  if (month === 0 && day === 2) {
    return 'Vánoční prázdniny';
  }

  // July / August
  if (month === 6 || month === 7) {
    return 'Letní prázdniny';
  }

  return null;
}

export function getDayInfo(date: Date): DayInfo {
  const dateStr = formatDateToIso(date);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const holidayName = getCzechHoliday(date);
  const isHoliday = !!holidayName;
  const isSchoolDay = !isWeekend && !isHoliday;

  return {
    dateStr,
    date,
    dayOfWeek,
    isWeekend,
    isHoliday,
    holidayName: holidayName || undefined,
    isSchoolDay,
  };
}

export function getMonthDays(year: number, monthIndex: number): DayInfo[] {
  const days: DayInfo[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    days.push(getDayInfo(date));
  }
  return days;
}

// Generate the 10 standard school months: September (year) to June (year+1)
export interface SchoolMonthOption {
  key: string; // '2026-09'
  year: number;
  monthIndex: number; // 0-11
  label: string;
  isPastOrCurrent: boolean;
}

export function getSchoolMonths(startYear: number, referenceDate: Date = new Date()): SchoolMonthOption[] {
  const monthsOrder = [
    { m: 8, y: startYear }, // Září
    { m: 9, y: startYear }, // Říjen
    { m: 10, y: startYear }, // Listopad
    { m: 11, y: startYear }, // Prosinec
    { m: 0, y: startYear + 1 }, // Leden
    { m: 1, y: startYear + 1 }, // Únor
    { m: 2, y: startYear + 1 }, // Březen
    { m: 3, y: startYear + 1 }, // Duben
    { m: 4, y: startYear + 1 }, // Květen
    { m: 5, y: startYear + 1 }, // Červen
  ];

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  return monthsOrder.map(({ m, y }) => {
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = formatCzechMonthYear(y, m);
    // Is this month before or equal to current month?
    const isPastOrCurrent = (y < currentYear) || (y === currentYear && m <= currentMonth);

    return {
      key,
      year: y,
      monthIndex: m,
      label,
      isPastOrCurrent,
    };
  });
}

// Format currency in CZK
export function formatCzk(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('cs-CZ');
  return `${formatted} Kč`;
}
