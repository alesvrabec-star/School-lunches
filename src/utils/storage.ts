import {
  AppSettings,
  LunchRecord,
  MonthlyPaymentRecord,
  ExtraPayment,
  OverallSettlement,
  MonthSummary,
} from '../types/lunch';
import {
  getSchoolMonths,
  getMonthDays,
  formatDateToIso,
  parseIsoDate,
} from './czechCalendar';

const STORAGE_KEYS = {
  SETTINGS: 'obednik_settings_v1',
  RECORDS: 'obednik_records_v1',
  PAYMENTS: 'obednik_payments_v1',
  EXTRAS: 'obednik_extras_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  child: {
    name: 'Tomáš',
    schoolName: 'ZŠ Komenského',
    grade: '4. B',
    canteenAccount: '123456789/0800',
    symbol: '4208',
  },
  pricePerLunch: 42, // Kč za 1 oběd
  monthlyPayment: 880, // Kč měsíčně trvalý příkaz (cca 20-21 dní * 42 Kč)
  schoolYear: '2026/2027',
  schoolYearStartYear: 2026,
  initialBalance: 0, // Kč (převod z loňska)
  paymentDayOfMonth: 15,
  defaultMealName: 'Oběd č. 1',
};

// Seed realistic starter data for September and October 2026
function generateInitialRecords(): Record<string, LunchRecord> {
  const records: Record<string, LunchRecord> = {};
  
  // September 2026 (year 2026, month 8)
  // School started Tue Sep 1st
  const sepDays = getMonthDays(2026, 8);
  for (const day of sepDays) {
    if (day.isWeekend || day.isHoliday) continue;
    // Sep 1 to Sep 30
    const dayNum = day.date.getDate();
    if (dayNum === 25) {
      // Tomáš byl jeden den odhlášen (zubař)
      records[day.dateStr] = {
        date: day.dateStr,
        status: 'canceled',
        note: 'Kontrola u zubaře',
      };
    } else {
      records[day.dateStr] = {
        date: day.dateStr,
        status: 'eaten',
      };
    }
  }

  // October 2026 (up to Oct 10th eaten, 11th is Sunday, etc.)
  const octDays = getMonthDays(2026, 9);
  for (const day of octDays) {
    if (day.isWeekend || day.isHoliday) continue;
    const dayNum = day.date.getDate();
    if (dayNum < 11) {
      // past days in October
      if (dayNum === 7) {
        records[day.dateStr] = {
          date: day.dateStr,
          status: 'canceled',
          note: 'Rýma, omluven',
        };
      } else {
        records[day.dateStr] = {
          date: day.dateStr,
          status: 'eaten',
        };
      }
    }
  }

  return records;
}

function generateInitialPayments(startYear: number, monthlyAmount: number): Record<string, MonthlyPaymentRecord> {
  const months = getSchoolMonths(startYear, new Date(2026, 9, 11));
  const payments: Record<string, MonthlyPaymentRecord> = {};

  months.forEach((m) => {
    // September paid, October paid (around 15th)
    const isPaid = m.key === '2026-09' || m.key === '2026-10';
    payments[m.key] = {
      id: m.key,
      monthKey: m.key,
      label: m.label,
      plannedAmount: monthlyAmount,
      paid: isPaid,
      actualAmount: monthlyAmount,
      paidDate: isPaid ? `${m.key}-15` : undefined,
      note: isPaid ? 'Trvalý příkaz zadaný v bance' : undefined,
    };
  });

  return payments;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, child: { ...DEFAULT_SETTINGS.child, ...parsed.child } };
  } catch (e) {
    console.error('Error loading settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadRecords(): Record<string, LunchRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      const initial = generateInitialRecords();
      saveRecords(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading records', e);
    return {};
  }
}

export function saveRecords(records: Record<string, LunchRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records', e);
  }
}

export function loadPayments(startYear: number, monthlyAmount: number): Record<string, MonthlyPaymentRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      const initial = generateInitialPayments(startYear, monthlyAmount);
      savePayments(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading payments', e);
    return generateInitialPayments(startYear, monthlyAmount);
  }
}

export function savePayments(payments: Record<string, MonthlyPaymentRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  } catch (e) {
    console.error('Error saving payments', e);
  }
}

export function loadExtraPayments(): ExtraPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXTRAS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading extras', e);
    return [];
  }
}

export function saveExtraPayments(extras: ExtraPayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(extras));
  } catch (e) {
    console.error('Error saving extras', e);
  }
}

// Compute settlement and calculations
export function computeSettlement(
  settings: AppSettings,
  records: Record<string, LunchRecord>,
  payments: Record<string, MonthlyPaymentRecord>,
  extraPayments: ExtraPayment[],
  todayIso: string
): OverallSettlement {
  const schoolMonths = getSchoolMonths(settings.schoolYearStartYear);
  const todayDate = parseIsoDate(todayIso);

  let eatenCount = 0;
  let canceledCount = 0;
  let missedCount = 0;
  let unmarkedPastCount = 0;
  let totalSchoolDaysSoFar = 0;
  let futureSchoolDaysCount = 0;

  schoolMonths.forEach((m) => {
    const days = getMonthDays(m.year, m.monthIndex);
    days.forEach((day) => {
      if (day.isWeekend || day.isHoliday) return;

      const rec = records[day.dateStr];
      const isPast = day.dateStr < todayIso;
      const isToday = day.dateStr === todayIso;

      if (isPast || isToday) {
        totalSchoolDaysSoFar++;
        if (!rec || rec.status === 'unmarked') {
          unmarkedPastCount++;
        } else if (rec.status === 'eaten') {
          eatenCount++;
        } else if (rec.status === 'canceled') {
          canceledCount++;
        } else if (rec.status === 'missed') {
          missedCount++;
        }
      } else {
        futureSchoolDaysCount++;
        // If already planned in the future
        if (rec) {
          if (rec.status === 'canceled') {
            // Future canceled day doesn't add to cost
          }
        }
      }
    });
  });

  const price = settings.pricePerLunch;
  const totalSpentOnLunches = (eatenCount + missedCount) * price;
  const totalSavedByCancelation = canceledCount * price;

  // Payments so far
  let totalPaidSoFar = settings.initialBalance || 0;

  schoolMonths.forEach((m) => {
    const pay = payments[m.key];
    if (pay && pay.paid) {
      totalPaidSoFar += pay.actualAmount ?? pay.plannedAmount;
    }
  });

  extraPayments.forEach((extra) => {
    totalPaidSoFar += extra.amount;
  });

  const currentBalance = totalPaidSoFar - totalSpentOnLunches;

  // End of year projection:
  // All 10 months planned payments
  let projectedTotalPayments = settings.initialBalance || 0;
  schoolMonths.forEach((m) => {
    const pay = payments[m.key];
    if (pay) {
      if (pay.paid) {
        projectedTotalPayments += pay.actualAmount ?? pay.plannedAmount;
      } else {
        projectedTotalPayments += pay.plannedAmount;
      }
    } else {
      projectedTotalPayments += settings.monthlyPayment;
    }
  });
  extraPayments.forEach((extra) => {
    projectedTotalPayments += extra.amount;
  });

  // Future estimated school days costs:
  let projectedFutureCost = 0;
  schoolMonths.forEach((m) => {
    const days = getMonthDays(m.year, m.monthIndex);
    days.forEach((day) => {
      if (day.isWeekend || day.isHoliday) return;
      if (day.dateStr > todayIso) {
        const rec = records[day.dateStr];
        // If parent already pre-marked it as canceled, don't charge
        if (rec?.status === 'canceled') {
          // free
        } else {
          projectedFutureCost += price;
        }
      }
    });
  });

  const projectedTotalYearCostIfNormal = totalSpentOnLunches + projectedFutureCost;
  const projectedEndYearBalance = projectedTotalPayments - projectedTotalYearCostIfNormal;

  return {
    totalSchoolDaysSoFar,
    eatenCount,
    canceledCount,
    missedCount,
    unmarkedPastCount,
    futureSchoolDaysCount,
    totalSpentOnLunches,
    totalSavedByCancelation,
    totalPaidSoFar,
    currentBalance,
    projectedTotalPayments,
    projectedRemainingSchoolDays: futureSchoolDaysCount,
    projectedTotalYearCostIfNormal,
    projectedEndYearBalance,
  };
}

export function computeMonthSummary(
  year: number,
  monthIndex: number,
  settings: AppSettings,
  records: Record<string, LunchRecord>,
  payment?: MonthlyPaymentRecord,
  todayIso: string = formatDateToIso(new Date())
): MonthSummary {
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const days = getMonthDays(year, monthIndex);
  const monthsNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  const monthName = `${monthsNames[monthIndex]} ${year}`;

  let totalSchoolDays = 0;
  let eatenCount = 0;
  let canceledCount = 0;
  let missedCount = 0;
  let unmarkedPastCount = 0;
  let holidayCount = 0;

  days.forEach((day) => {
    if (day.isWeekend) return;
    if (day.isHoliday) {
      holidayCount++;
      return;
    }

    totalSchoolDays++;
    const rec = records[day.dateStr];
    const isPast = day.dateStr <= todayIso;

    if (rec?.status === 'eaten') eatenCount++;
    else if (rec?.status === 'canceled') canceledCount++;
    else if (rec?.status === 'missed') missedCount++;
    else if (isPast) unmarkedPastCount++;
  });

  const price = settings.pricePerLunch;
  const costEaten = eatenCount * price;
  const costMissed = missedCount * price;
  const totalCost = costEaten + costMissed;
  const paidAmount = payment && payment.paid ? (payment.actualAmount ?? payment.plannedAmount) : 0;
  const difference = paidAmount - totalCost;

  return {
    monthKey,
    monthName,
    monthIndex,
    year,
    totalSchoolDays,
    eatenCount,
    canceledCount,
    missedCount,
    unmarkedPastCount,
    holidayCount,
    costEaten,
    costMissed,
    totalCost,
    paidAmount,
    difference,
  };
}
